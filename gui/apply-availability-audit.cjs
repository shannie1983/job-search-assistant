const fs=require('node:fs');
const path=require('node:path');
const {verifyJobs}=require('./availability.cjs');

async function run(){
  const root=path.resolve(__dirname,'..'),resultsFile=path.join(root,'outputs','results.json'),auditFile=path.join(root,'outputs','job-availability-audit.json');
  const results=JSON.parse(fs.readFileSync(resultsFile,'utf8'));const reviewed=await verifyJobs(results.jobs||[]);const available=reviewed.filter(job=>job.availability.state==='available');const checkedAt=new Date().toISOString();
  const excluded=reviewed.filter(job=>job.availability.state!=='available').map(job=>({id:job.id,title:job.title,company:job.company,url:job.url,reason:job.availability.reason,http_status:job.availability.http_status}));
  results.jobs=available;results.updated_at=checkedAt;results.run_status=available.length?`Verified ${available.length} live employer postings`:'No live employer postings passed verification';results.summary=`${available.length} live posting(s) retained; ${excluded.length} unavailable or unverifiable posting(s) removed.`;
  results.history=results.history||[];results.history.push({time:checkedAt,operation:'strict_live_employer_job_link_audit',status:'completed',result:results.summary,available_jobs:available.map(job=>job.id),excluded_jobs:excluded});
  results.runs=[...(results.runs||[]),{date:checkedAt,title:'Strict live employer-page audit',status:'Completed',description:results.summary}];
  const audit={checked_at:checkedAt,available_jobs:available.map(job=>({id:job.id,title:job.title,company:job.company,url:job.url,availability:job.availability})),excluded_jobs:excluded};
  fs.writeFileSync(auditFile+'.tmp',JSON.stringify(audit,null,2)+'\n');fs.renameSync(auditFile+'.tmp',auditFile);fs.writeFileSync(resultsFile+'.tmp',JSON.stringify(results,null,2)+'\n');fs.renameSync(resultsFile+'.tmp',resultsFile);
  console.log(JSON.stringify({available:available.length,excluded:excluded.length,retained:available.map(job=>`${job.company}: ${job.title}`),failures:excluded},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1});
