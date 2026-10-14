const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const significantTitleTerms=title=>normalize(title).split(' ').filter(term=>term.length>=4&&!['senior','staff','engineer','scientist','manager'].includes(term));
const titleMatches=(title,text)=>{const terms=significantTitleTerms(title);return !terms.length||terms.some(term=>normalize(text).includes(term))};
function workdayApiUrl(url){
  if(!/\.myworkdayjobs\.com$/i.test(url.hostname))return null;
  const parts=url.pathname.split('/').filter(Boolean);const jobIndex=parts.indexOf('job');
  if(jobIndex<1||!parts[jobIndex+1])return null;
  const tenant=url.hostname.split('.')[0],site=parts[jobIndex-1];
  return new URL(`/wday/cxs/${tenant}/${site}/job/${parts[jobIndex+1]}`,url.origin);
}

async function verifyJobUrl(job, fetcher=fetch) {
  const checked_at=new Date().toISOString();
  let url;
  try{url=new URL(job.url)}catch{return {state:'unavailable',checked_at,http_status:null,reason:'Invalid job URL'}}
  if(!['https:','http:'].includes(url.protocol))return {state:'unavailable',checked_at,http_status:null,reason:'Unsupported job URL protocol'};
  try{
    const workday=workdayApiUrl(url);const target=workday||url;
    const response=await fetcher(target,{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{Accept:workday?'application/json':'text/html,application/xhtml+xml','User-Agent':'Mozilla/5.0 PersonalJobWorkspace/1.0'}});
    if(!response.ok)return {state:'unavailable',checked_at,http_status:response.status,reason:`Employer page returned HTTP ${response.status}`};
    const type=response.headers?.get?.('content-type')||'';
    const body=(await response.text()).slice(0,1500000);
    if(workday){
      let payload;try{payload=JSON.parse(body)}catch{return {state:'unavailable',checked_at,http_status:response.status,reason:'Workday did not return a live job record'}}
      const posting=payload.jobPostingInfo;if(!posting?.title||!titleMatches(job.title,posting.title))return {state:'unavailable',checked_at,http_status:response.status,reason:'Workday has no matching live job record'};
      if(!posting.externalUrl&&!posting.jobDescription)return {state:'unavailable',checked_at,http_status:response.status,reason:'Workday record has no application path'};
      return {state:'available',checked_at,http_status:response.status,reason:'Verified against the live Workday job record and application path',final_url:posting.externalUrl||url.href};
    }
    if(type&&!/html|text/.test(type))return {state:'unavailable',checked_at,http_status:response.status,reason:'Employer link did not return a readable job page'};
    const text=normalize(body);
    if(/job (is )?no longer available|position (has been )?filled|job has expired|posting (is )?closed|no longer accepting applications/.test(text))return {state:'unavailable',checked_at,http_status:response.status,reason:'Employer page says the posting is closed'};
    if(!titleMatches(job.title,text))return {state:'unavailable',checked_at,http_status:response.status,reason:'Page is reachable but the saved job title is not present'};
    if(!/(apply|apply now|accepting applications|submit application|start your application)/.test(text))return {state:'unavailable',checked_at,http_status:response.status,reason:'Page has no active application path'};
    return {state:'available',checked_at,http_status:response.status,reason:'Employer job page contains the role and an active application path',final_url:response.url||url.href};
  }catch(error){return {state:'unavailable',checked_at,http_status:null,reason:'Employer page could not be verified: '+error.message}}
}

async function verifyJobs(jobs,fetcher=fetch){return Promise.all((jobs||[]).map(async job=>({...job,availability:await verifyJobUrl(job,fetcher)})))}

module.exports={verifyJobUrl,verifyJobs,significantTitleTerms,workdayApiUrl};
