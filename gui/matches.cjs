const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { matchingLocationPreferences } = require('./location.cjs');
const { experienceRequirementPasses } = require('./requirements.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const normalizeMatchText=value=>String(value||'').toLowerCase().replace(/\bai\s*\/\s*ml\b|\bmachine[-\s]learning\b|\bml\b/g,'machine learning').replace(/\batmospheric science\b/g,'atmosphere science').replace(/[^a-z0-9+#]+/g,' ').replace(/\s+/g,' ').trim();
const values = value => (Array.isArray(value) ? value : []).map(normalizeMatchText).filter(Boolean);
function preferenceAssessment(job, preferences) {
  let text=normalizeMatchText(`${job.title||''} ${job.description||''} ${(job.tags||[]).join(' ')}`);
  if (/\bllm\b|\bdata scientist\b/.test(text) && !text.includes('machine learning')) text += ' machine learning';
  if (/\bquantum\b/.test(text) && !text.includes('quantum computing')) text += ' quantum computing';
  const location=String(job.location||'').toLowerCase();const modes=preferences.preference_modes||{};
  const groups=[
    {key:'target_roles',weight:30,mode:'any',items:values(preferences.target_roles),matched:values(preferences.target_roles).filter(item=>text.includes(item))},
    {key:'keywords',weight:20,mode:'coverage',items:values(preferences.keywords),matched:values(preferences.keywords).filter(item=>text.includes(item))},
    {key:'preferred_locations',weight:25,mode:'any',items:values(preferences.preferred_locations),matched:matchingLocationPreferences(job,preferences.preferred_locations).map(item=>String(item).toLowerCase().trim())},
    {key:'work_arrangements',weight:10,mode:'any',items:values(preferences.work_arrangements),matched:values(preferences.work_arrangements).filter(item=>(item==='remote'&&job.remote)||text.includes(item)||location.includes(item))},
    {key:'employment_types',weight:5,mode:'any',items:values(preferences.employment_types),matched:values(preferences.employment_types).filter(item=>text.includes(item))},
    {key:'preferred_industries',weight:5,mode:'any',items:values(preferences.preferred_industries),matched:values(preferences.preferred_industries).filter(item=>text.includes(item))},
    {key:'sources',weight:5,mode:'any',items:values(preferences.sources),matched:values(preferences.sources).filter(item=>text.includes(item)||String(job.source||'').toLowerCase().includes(item.replace(/\.com$/,'')))}
  ];
  const configured=groups.filter(group=>group.items.length);const denominator=configured.reduce((sum,group)=>sum+group.weight,0)||1;
  const points=configured.reduce((sum,group)=>sum+group.weight*(group.mode==='coverage'?(group.matched.length/group.items.length):(group.matched.length?1:0)),0);
  // Configured locations are always hard eligibility rules. Keywords also
  // require one match; additional matches increase the coverage score.
  const failedLocks=configured.filter(group=>(modes[group.key]==='required'||group.key==='keywords'||group.key==='preferred_locations')&&!group.matched.length).map(group=>group.key);
  const experience=experienceRequirementPasses(job,preferences.experience_years);if(!experience.passes)failedLocks.push('experience_years');
  return {score:configured.length?Math.round(points/denominator*100):100,passed_locked_preferences:failedLocks.length===0,failed_locked_preferences:failedLocks,keyword_match_count:groups.find(group=>group.key==='keywords')?.matched.length||0,required_experience_years:experience.required,groups:configured.map(group=>({name:group.key,required:modes[group.key]==='required'||group.key==='keywords'||group.key==='preferred_locations',matched:group.matched}))};
}
function attachMatches(results, preferences, root) {
  const file = path.join(root, 'outputs/ai_matches.json');
  if (!fs.existsSync(file)) return results;
  const assessment = JSON.parse(fs.readFileSync(file, 'utf8'));
  const resumePath = preferences.master_resume && path.resolve(root, preferences.master_resume);
  const validResume = resumePath && resumePath.startsWith(path.join(root, 'Jobs') + path.sep) && fs.existsSync(resumePath) && preferences.master_resume === assessment.master_resume && hash(fs.readFileSync(resumePath)) === assessment.resume_sha256;
  const scored=results.jobs.filter(job=>String(job.source||'').toLowerCase()!=='remotive'&&job.availability?.state==='available').map(job => {
    const match = assessment.matches.find(m => m.job_id === job.id);
    const valid = validResume && match && match.job_sha256 === hash(job.title + '\n' + job.description);
    const preference=preferenceAssessment(job,preferences);const combined=valid&&preference.passed_locked_preferences?Math.round(match.score*.75+preference.score*.25):null;
    const recommendation=!preference.passed_locked_preferences?'Skip':combined>=75?'Apply':combined>=55?'Apply if tailored':'Skip';
    return { ...job, resume_match:valid?match.score:null, preference_match:preference, combined_score:combined, ai_match: valid ? {...match,original_resume_score:match.score,score:combined,recommendation,summary:`${recommendation}. Combined documented fit ${combined}/100: resume evidence ${match.score}/100 (75%) + job preferences ${preference.score}/100 (25%). ${match.summary}`} : null, ai_match_state: valid ? preference.passed_locked_preferences?'assessed':'excluded — locked preference not met' : match ? 'outdated — reassessment needed' : 'awaiting resume assessment' };
  });
  const rankJobs=(a,b)=>(b.combined_score??-1)-(a.combined_score??-1)||b.preference_match.keyword_match_count-a.preference_match.keyword_match_count||(b.rank||0)-(a.rank||0);
  const qualified=scored.filter(job=>job.combined_score!==null).sort(rankJobs).slice(0,10);
  const visible=qualified.length?qualified:scored.filter(job=>job.preference_match.passed_locked_preferences).sort(rankJobs).slice(0,10);
  return { ...results, jobs:visible, evaluated_jobs:scored.length, qualified_jobs:qualified.length, score_note:qualified.length?'Internal documented-fit ranking, not an employer ATS score or hiring probability.':'Preference-qualified postings are shown while resume evidence assessment is pending.', match_method: assessment.method, match_rubric: assessment.rubric };
}
module.exports = { hash, attachMatches, preferenceAssessment };
