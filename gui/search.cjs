const fs = require('node:fs');
const path = require('node:path');
const { matchingLocationPreferences } = require('./location.cjs');
const { experienceRequirementPasses } = require('./requirements.cjs');
const { verifyJobs } = require('./availability.cjs');
const strip = text => String(text || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function searchLinks(preferences) {
  const terms=(preferences.target_roles||[]).length?preferences.target_roles:preferences.keywords||[];
  const locations=preferences.preferred_locations.length?preferences.preferred_locations:[''];return terms.flatMap((role,termIndex)=>preferences.sources.map((source,sourceIndex)=>({source,location:locations[(termIndex+sourceIndex)%locations.length]})).map(({source,location}) => {
    let url;
    if (/usajobs/i.test(source)) url = 'https://www.usajobs.gov/Search/Results/?' + new URLSearchParams({ k: role, l: location });
    if (/linkedin/i.test(source)) url = 'https://www.linkedin.com/jobs/search/?' + new URLSearchParams({ keywords: role, location });
    if (/indeed/i.test(source)) url = 'https://www.indeed.com/jobs?' + new URLSearchParams({ q: role, l: location });
    if (/dice/i.test(source)) url = 'https://www.dice.com/jobs?' + new URLSearchParams({ q: role, location });
    if (/clearancejobs/i.test(source)) url = 'https://www.clearancejobs.com/jobs?' + new URLSearchParams({ keywords: role, location });
    if (/nasa\.gov/i.test(source)) url = 'https://www.nasa.gov/careers/';
    if (/noaa\.gov/i.test(source)) url = 'https://www.noaa.gov/careers';
    return url ? { title: `${source}: ${role} · ${location || 'Any location'}`, url } : null;
  })).filter(Boolean);
}
function rank(jobs, preferences) {
  const roles = (preferences.target_roles||[]).map(s => s.toLowerCase().trim()).filter(Boolean);
  const keywords = (preferences.keywords||[]).map(s => s.toLowerCase().trim()).filter(Boolean);
  const modes = preferences.preference_modes || {};
  return jobs.map(job => {
    const text = `${job.title} ${job.description} ${(job.tags || []).join(' ')}`.toLowerCase();
    const roleMatches = roles.filter(role => text.includes(role) || (role === 'atmosphere science' && /atmospheric science/.test(text)));
    const keywordMatches = keywords.filter(keyword => text.includes(keyword));
    const matches = [...roleMatches, ...keywordMatches];
    const locationMatches = matchingLocationPreferences(job, preferences.preferred_locations);
    const experience = experienceRequirementPasses(job, preferences.experience_years);
    const hardPass = (modes.target_roles!=='required'||!roles.length||roleMatches.length>0) && (!keywords.length||keywordMatches.length>0) && (modes.preferred_locations!=='required'||!preferences.preferred_locations.length||locationMatches.length>0) && experience.passes;
    return { ...job, hard_pass:hardPass, matched_keywords: matches, required_experience_years:experience.required, rank: roleMatches.length * 10 + keywordMatches.length * 6 + locationMatches.length * 4, reason: matches.length ? `Preference matches: ${matches.join(', ')}. More keyword matches rank higher; at least one configured keyword and all locked preferences are required.` : 'No configured title or keyword matched.', gaps: experience.passes ? ['Location eligibility and other required qualifications need review.'] : [`Posting requires ${experience.required} years; saved experience is ${experience.available}.`], status: 'discovered' };
  }).filter(job => job.hard_pass).sort((a,b) => b.rank-a.rank);
}
async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw Error(`Source returned HTTP ${response.status}`);
  return response.json();
}
function publicSearchLocation(value){const text=String(value||'');if(/hampton roads?/i.test(text))return 'Hampton, Virginia';if(/washington\s*d\.?c\.?/i.test(text))return 'Washington, District of Columbia';if(/remote/i.test(text))return 'Remote';return text.replace(/,?\s*(?:US|USA|United States)\s*$/i,'').trim()}
async function usaJobsWebSearch(preferences,checked){
  const landing=await fetch('https://www.usajobs.gov/Search/Results',{signal:AbortSignal.timeout(25000)});if(!landing.ok)throw Error(`USAJOBS public search returned HTTP ${landing.status}`);const cookies=landing.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
  const terms=((preferences.target_roles||[]).length?preferences.target_roles:preferences.keywords||[]).slice(0,8);const locations=(preferences.preferred_locations||[]).map(publicSearchLocation).filter(Boolean);
  const responses=await Promise.allSettled(terms.map(term=>fetch('https://www.usajobs.gov/Search/ExecuteSearch',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8',Cookie:cookies},signal:AbortSignal.timeout(30000),body:JSON.stringify({Keyword:term,LocationName:locations,ResultsPerPage:25,Page:1})}).then(async response=>{if(!response.ok)throw Error(`USAJOBS public search returned HTTP ${response.status}`);return {term,data:await response.json()}})));
  const success=responses.filter(result=>result.status==='fulfilled');if(!success.length)throw Error(responses[0]?.reason?.message||'USAJOBS public webpage search failed');
  const jobs=success.flatMap(result=>(result.value.data.Jobs||[]).map(item=>({id:`usajobs:${item.DocumentID}`,company:item.Agency||item.Department||'U.S. Government',title:item.Title,location:(item.LocationDisplay||item.LocationName||'United States')+', US',remote:/remote/i.test(item.LocationDisplay||item.LocationName||''),url:String(item.PositionURI||`https://www.usajobs.gov/job/${item.DocumentID}`).replace(':443',''),source:'USAJOBS public webpage',publication_date:item.PositionStartDate,deadline:item.PositionEndDate,checked_at:checked,description:[item.Title,item.Agency,item.Department,item.SalaryDisplay,item.DateDisplay,item.WorkSchedule,item.WorkType,...(item.JobCategoryCode||[]).map(category=>category.Name),`Search keyword: ${result.value.term}`].filter(Boolean).join('. '),tags:[result.value.term],salary:item.SalaryDisplay||'Not disclosed'})));
  return {jobs,note:`Credential-free USAJOBS public webpage search completed for ${success.length} keyword(s); ${responses.length-success.length} request(s) failed. Open each official announcement to verify duties, eligibility, location, and deadline.`};
}
async function discover(provider, preferences, root) {
  const checked = new Date().toISOString();
  let jobs, note;
  if (provider === 'remotive') {
    const cache = path.join(root, 'outputs/remotive-cache.json');
    let payload;
    if (fs.existsSync(cache) && Date.now()-fs.statSync(cache).mtimeMs < 6*3600*1000) {
      payload = JSON.parse(fs.readFileSync(cache, 'utf8')); note = `Using six-hour cache fetched at ${payload.fetched_at}. Remotive listings are delayed by 24 hours.`;
    } else {
      try {
        payload = { fetched_at: checked, data: await getJson('https://remotive.com/api/remote-jobs') };
        fs.writeFileSync(cache, JSON.stringify(payload)); note = 'Fetched live from Remotive. Listings are delayed by 24 hours; feed cached for six hours.';
      } catch (error) {
        if (!fs.existsSync(cache)) throw Error(`Unable to reach Remotive: ${error.message}`);
        payload = JSON.parse(fs.readFileSync(cache, 'utf8'));
        note = `Live Remotive request failed (${error.message}); using older cache fetched at ${payload.fetched_at}. Results may be stale.`;
      }
    }
    jobs = payload.data.jobs.map(j => ({ id: `remotive:${j.id}`, company: j.company_name, title: j.title, location: j.candidate_required_location || 'Remote eligibility unspecified', remote: true, url: j.url, source: 'Remotive', publication_date: j.publication_date, checked_at: checked, description: strip(j.description), tags: j.tags || [], salary: j.salary || 'Not disclosed' }));
  } else if (provider === 'usajobs') {
    if (!process.env.USAJOBS_API_KEY || !process.env.USAJOBS_EMAIL){const fallback=await usaJobsWebSearch(preferences,checked);jobs=fallback.jobs;note=fallback.note;}else{
    const queryTerms=((preferences.target_roles||[]).length?preferences.target_roles:preferences.keywords||[]).slice(0,10);
    const requests = queryTerms.map(role => getJson('https://data.usajobs.gov/api/Search?' + new URLSearchParams({ Keyword: role, ResultsPerPage: '100', Fields: 'Full' }), { Host: 'data.usajobs.gov', 'User-Agent': process.env.USAJOBS_EMAIL, 'Authorization-Key': process.env.USAJOBS_API_KEY }));
    const responses = await Promise.allSettled(requests);
    const success = responses.filter(r => r.status === 'fulfilled');
    if (!success.length) throw Error(responses[0]?.reason?.message || 'USAJOBS search failed');
    jobs = success.flatMap(r => (r.value.SearchResult?.SearchResultItems || []).map(item => { const j = item.MatchedObjectDescriptor;return { id: `usajobs:${item.MatchedObjectId}`, company: j.OrganizationName, title: j.PositionTitle, location: (j.PositionLocationDisplay || 'United States')+', US', remote: j.UserArea?.Details?.RemoteIndicator === true || j.UserArea?.Details?.RemoteIndicator === 'True', url: j.PositionURI, source: 'USAJOBS', publication_date: j.PublicationStartDate, deadline: j.ApplicationCloseDate, checked_at: checked, description: strip(JSON.stringify(j.UserArea?.Details || {})), tags: [] }; }));
    note = `USAJOBS first page per keyword (up to 100 each); ${responses.length-success.length} keyword requests failed. Location preferences boost ranking; they are not strict eligibility filters.`;
    }
  } else throw Error('Choose Remotive or USAJOBS');
  const merged=new Map();for(const job of jobs){const prior=merged.get(job.id);if(!prior){merged.set(job.id,job);continue}const tags=[...new Set([...(prior.tags||[]),...(job.tags||[])])];merged.set(job.id,{...prior,tags,description:[prior.description,job.description].filter(Boolean).join('. ')})}const unique=[...merged.values()];
  const ranked=rank(unique,preferences);const verified=await verifyJobs(ranked);const available=verified.filter(job=>job.availability.state==='available');
  return { jobs: available, fetched_count: unique.length, note:`${note} ${available.length} employer job page(s) were verified available; ${verified.length-available.length} unavailable or unverified link(s) were excluded.`, checked_at: checked, search_links: searchLinks(preferences) };
}
module.exports = { discover, rank, searchLinks };
