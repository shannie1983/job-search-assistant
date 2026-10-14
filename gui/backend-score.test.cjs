const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scoreJob,scoreAndFilter}=require('./backend-score.cjs');

test('JobClaw fit rubric exposes weighted subscores and an apply recommendation',()=>{
  const job={title:'Machine Learning Scientist',description:'Python machine learning remote sensing validation and statistics',location:'Remote, US',remote:true};
  const preferences={target_roles:['Machine Learning Scientist'],keywords:['machine learning','remote sensing'],preferred_locations:['Remote, US'],preference_modes:{}};
  const result=scoreJob(job,'Python machine learning remote sensing validation statistics research',preferences);
  assert.deepEqual(Object.keys(result.backend_score.subscores),['must_haves','seniority_scope','domain_relevance','keyword_coverage','location_work_auth']);
  assert.equal(Object.values(result.backend_score.subscores).reduce((a,b)=>a+b,0),result.backend_score.score);
  assert.equal(result.ai_match.recommendation,'Apply');
  assert.equal(result.ai_match.criteria.reduce((sum,item)=>sum+item.maximum,0),100);
});

test('locked location and keyword rules remain hard filters',()=>{
  const preferences={keywords:['machine learning'],preferred_locations:['Remote, US'],preference_modes:{}};
  const jobs=[{title:'Accountant',description:'financial reporting',location:'Toronto, Canada'}];
  assert.equal(scoreAndFilter(jobs,'machine learning',preferences).length,0);
});
