const {test}=require('node:test');const assert=require('node:assert/strict');const ai=require('./openai-tailor.cjs');
test('validates sourced AI changes and blocks unsupported new durations',()=>{
 const paragraphs=[{index:0,text:'Python engineer with 3 years of experience.'}];const job={title:'Python Engineer',description:'Python and Kubernetes required'};
 const proposal={changes:[{index:0,after:'Engineer with 3 years of Python experience.',rationale:'Focus',source_indices:[0]}],keywords:['Python','Kubernetes','invented-keyword'],gaps:['Kubernetes not demonstrated']};
 const result=ai.validateProposal(proposal,paragraphs,job);assert.equal(result.changes[0].before,paragraphs[0].text);assert.deepEqual(result.keywords,['Python','Kubernetes']);
 assert.throws(()=>ai.validateProposal({...proposal,changes:[{...proposal.changes[0],after:'Python engineer with 9 years.'}]},paragraphs,job),/unsupported numeric/);
});
test('uses Responses structured output without writing a key and rejects failed responses',async()=>{
 ai.configure({key:'test-only-placeholder',model:'test-model'});let request;
 const mock=async(url,options)=>{request={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({changes:[],keywords:['Python'],gaps:[]})}]}]})}};
 await ai.generate([{index:0,text:'Python'}],{title:'Python',description:'Python role'},mock);assert.equal(request.url,'https://api.openai.com/v1/responses');assert.equal(request.body.store,false);assert.equal(request.body.text.format.strict,true);
 await assert.rejects(ai.generate([],{title:'Role',description:'Job'},async()=>({ok:false,status:401})),/HTTP 401/);
 ai.configure({clear:true});await assert.rejects(ai.generate([],{title:'Role',description:'Job'}),/No CV text was sent/);
});
