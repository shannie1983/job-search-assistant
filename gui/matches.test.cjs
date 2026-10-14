const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const {hash,attachMatches,preferenceAssessment}=require('./matches.cjs');
test('invalidates score after resume or posting changes and sorts valid scores first',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'job-match-'));fs.mkdirSync(path.join(root,'Jobs'));fs.mkdirSync(path.join(root,'outputs'));fs.writeFileSync(path.join(root,'Jobs/master.docx'),'original');
 const available={state:'available'};const a={id:'a',title:'A',description:'First',availability:available};const b={id:'b',title:'B',description:'Second',availability:available};
 fs.writeFileSync(path.join(root,'outputs/ai_matches.json'),JSON.stringify({master_resume:'Jobs/master.docx',resume_sha256:hash('original'),matches:[{job_id:'a',job_sha256:hash('A\nFirst'),score:90},{job_id:'b',job_sha256:hash('B\nSecond'),score:95}]}));
 const prefs={master_resume:'Jobs/master.docx'};assert.equal(attachMatches({jobs:[a,b]},prefs,root).jobs[0].id,'b');
 const changedPosting=attachMatches({jobs:[{...b,description:'Changed'}]},prefs,root);assert.equal(changedPosting.jobs.length,1);assert.equal(changedPosting.jobs[0].ai_match_state,'outdated — reassessment needed');
 fs.writeFileSync(path.join(root,'Jobs/master.docx'),'changed');const changedResume=attachMatches({jobs:[a,b]},prefs,root);assert.equal(changedResume.jobs.length,2);assert.ok(changedResume.jobs.every(job=>job.ai_match===null));
});

test('configured location is mandatory even when its saved mode is preferred',()=>{
 const prefs={preferred_locations:['Remote, US'],keywords:['machine learning'],preference_modes:{preferred_locations:'preferred'}};
 const outside=preferenceAssessment({title:'Machine Learning Engineer',description:'machine learning',location:'Toronto, Canada',remote:false},prefs);
 const inside=preferenceAssessment({title:'Machine Learning Engineer',description:'machine learning',location:'Remote, US',remote:true},prefs);
 assert.equal(outside.passed_locked_preferences,false);
 assert.ok(outside.failed_locked_preferences.includes('preferred_locations'));
 assert.equal(inside.passed_locked_preferences,true);
});

test('at least one keyword is required and additional keyword matches score higher',()=>{
 const prefs={preferred_locations:['Remote, US'],keywords:['machine learning','remote sensing','radiative transfer'],preference_modes:{keywords:'preferred'}};
 const none=preferenceAssessment({title:'Accountant',description:'financial reporting',location:'Remote, US',remote:true},prefs);
 const one=preferenceAssessment({title:'ML Engineer',description:'machine learning',location:'Remote, US',remote:true},prefs);
 const three=preferenceAssessment({title:'Scientist',description:'machine learning remote sensing radiative transfer',location:'Remote, US',remote:true},prefs);
 assert.equal(none.passed_locked_preferences,false);
 assert.equal(one.passed_locked_preferences,true);
 assert.equal(three.keyword_match_count,3);
 assert.ok(three.score>one.score);
});

test('hyphenated job text counts as the same configured keyword',()=>{
 const prefs={preferred_locations:['Remote, US'],keywords:['machine learning','remote sensing']};
 const result=preferenceAssessment({title:'Data Scientist',description:'Build machine-learning models for remote-sensing data.',location:'Remote, US',remote:true},prefs);
 assert.equal(result.keyword_match_count,2);
});
