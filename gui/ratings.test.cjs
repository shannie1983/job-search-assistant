const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {personalize,saveRating,readRatings}=require('./ratings.cjs');
test('feedback improves similar future roles but preserves AI score',()=>{
 const data={ratings:{a:{job_id:'a',rating:5,features:['ai']}}};
 const result=personalize({jobs:[{id:'future',title:'AI Engineer',ai_match:{score:60}},{id:'other',title:'React Developer',ai_match:{score:60}}]},data);
 assert.equal(result.jobs[0].id,'future');assert.ok(result.jobs[0].personalized_score>60);assert.equal(result.jobs[0].ai_match.score,60);assert.equal(result.jobs[1].personalized_score,60);
 assert.equal(personalize({jobs:[{id:'n',title:'AI Engineer'}]},data).jobs[0].personalized_score,null);
});
test('negative feedback lowers preference and neutral feedback has no boost',()=>{
 const job={id:'a',title:'AI Engineer',ai_match:{score:70}};
 assert.ok(personalize({jobs:[job]},{ratings:{a:{job_id:'a',rating:1,features:['ai']}}}).jobs[0].personalized_score<70);
 assert.equal(personalize({jobs:[job]},{ratings:{a:{job_id:'a',rating:3,features:['ai']}}}).jobs[0].personalized_score,70);
});
test('ratings persist, updates replace current vote, clear removes learning signal',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ratings-'));fs.mkdirSync(path.join(root,'config'));const job={id:'a',title:'AI Engineer'};
 assert.throws(()=>saveRating(root,job,6));saveRating(root,job,5);assert.equal(readRatings(root).ratings.a.rating,5);
 saveRating(root,job,2);assert.equal(Object.keys(readRatings(root).ratings).length,1);
 saveRating(root,job,null);assert.equal(Object.keys(readRatings(root).ratings).length,0);assert.equal(readRatings(root).events.length,3);
});
