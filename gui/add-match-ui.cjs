const fs=require('node:fs');const path=require('node:path');const file=path.join(__dirname,'index.html');let html=fs.readFileSync(file,'utf8');
const marker="addText(card,'p',job.reason||'Matching evidence pending');";
const replacement=`
if(job.ai_match){
 const match=job.ai_match;
 addText(card,'div',match.score+'/100 · '+match.band+' fit','number');
 const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=match.score;meter.setAttribute('aria-label','Documented job fit '+match.score+' out of 100');meter.style.width='100%';card.append(meter);
 addText(card,'p',match.summary);
 const details=document.createElement('details');card.append(details);addText(details,'summary','View AI evidence, score breakdown, and gaps');
 addText(details,'p','Assessment of the selected master resume, not a hiring probability. '+match.confidence,'hint');
 match.criteria.forEach(item=>{const row=addText(details,'div','','step');addText(row,'span',item.name+' — '+item.evidence);addText(row,'strong',item.points+'/'+item.maximum)});
 [['Supporting evidence',match.strengths],['Missing or unverified requirements',match.gaps],['Eligibility and interpretation',match.eligibility_notes]].forEach(([title,items])=>{addText(details,'h3',title);const list=addText(details,'ul','');items.forEach(item=>addText(list,'li',item))});
 addText(details,'small','Resume: '+state.preferences.master_resume+' · Evidence uses DOCX paragraph numbers. Assessed: '+match.assessed_at,'muted');
}else{addText(card,'p',job.ai_match_state||'Awaiting AI assessment','badge');addText(card,'p',job.reason||'Matching evidence pending')}
`;
if(!html.includes(marker))throw Error('Match UI insertion point missing');html=html.replace(marker,replacement);
html=html.replace('Review experience evidence, gaps, and application progress.','AI fit scores are sorted highest first. Expand each job to inspect requirements, resume evidence, and missing qualifications.');
html=html.replace("if(job.gaps)addText", "if(!job.ai_match&&job.gaps)addText");
fs.writeFileSync(file,html);fs.writeFileSync(path.join(__dirname,'browser-check.js'),html.match(/<script>([\s\S]*?)<\/script>/)[1]);
