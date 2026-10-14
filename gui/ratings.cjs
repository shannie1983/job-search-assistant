const fs=require('node:fs');const path=require('node:path');
const stop=new Set(['senior','junior','lead','principal','independent','full','stack','developer','engineer','architect','scientist','and','the']);
function features(job){
 const title=String(job.title||'').toLowerCase();
 const tokens=title.replace(/\.net/g,'dotnet').replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>1&&!stop.has(t));
 const groups=[['ai',/\bai\b|machine learning|\bml\b/],['data-science',/data scientist|data science/],['web',/react|full.stack|front.end|\.net/],['backend',/back.end/],['quantum',/quantum/],['earth-science',/remote sensing|atmospher|climate|radiative/]];
 groups.forEach(([label,re])=>{if(re.test(title))tokens.push(label)});
 return [...new Set(tokens)];
}
function similarity(a,b){const set=new Set(a);const intersection=b.filter(t=>set.has(t)).length;return intersection/(new Set([...a,...b]).size||1)}
function readRatings(root){const file=path.join(root,'config/ratings.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{ratings:{},events:[]}}
function saveRating(root,job,rating){
 if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))throw Error('Rating must be 1–5 stars or null to clear');
 const data=readRatings(root);const key=job.id||job.url;if(!key)throw Error('Job identifier required');
 const timestamp=new Date().toISOString();
 if(rating===null)delete data.ratings[key];else data.ratings[key]={job_id:key,rating,title:job.title,features:features(job),updated_at:timestamp};
 data.events.push({job_id:key,rating,at:timestamp});
 const file=path.join(root,'config/ratings.json');fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);return data;
}
function personalize(results,data){
 const ratings=Object.values(data.ratings);
 const jobs=results.jobs.map(job=>{
  const key=job.id||job.url;const own=data.ratings[key];let numerator=0,total=0,examples=0;
  for(const rated of ratings){const s=rated.job_id===key?1:similarity(features(job),rated.features);if(s<=0)continue;numerator+=s*(rated.rating-3)/2;total+=s;examples++}
  const adjustment=total?Math.round(12*numerator/(total+3)):0;
  const base=job.ai_match?.score;
  return {...job,owner_rating:own?.rating||null,preference_adjustment:adjustment,preference_examples:examples,personalized_score:Number.isFinite(base)?Math.max(0,Math.min(100,base+adjustment)):null};
 });
 jobs.sort((a,b)=>(b.personalized_score??-1)-(a.personalized_score??-1)||(b.ai_match?.score??-1)-(a.ai_match?.score??-1));
 return {...results,jobs,preference_learning:{rated_jobs:ratings.length,method:'Local title-feature similarity with a conservative feedback adjustment; AI fit scores and eligibility are unchanged.'}};
}
module.exports={features,similarity,readRatings,saveRating,personalize};
