const fs=require('node:fs');const path=require('node:path');const file=path.join(__dirname,'index.html');let html=fs.readFileSync(file,'utf8');
html=html.replace('</style>',`.score-row{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin:18px 0}.score-row .number{font-size:28px}.stars{display:flex;gap:4px}.star{font-size:27px;color:#a8b5a9;background:transparent;border:1px solid transparent;border-radius:6px;padding:3px 6px}.star.selected{color:#9d6504}.star:hover,.star:focus-visible{background:#fff3d6;border-color:#a97515}.rating-note{font-size:12px;color:#64776a;margin-top:6px}.clear-rating{background:none;border:0;color:#42634b;text-decoration:underline;font-size:12px;padding:5px}.ranking{max-width:280px;margin:15px 0}</style>`);
html=html.replace('AI fit scores are sorted highest first. Expand each job to inspect requirements, resume evidence, and missing qualifications.', 'Compare AI resume fit with your personal interest. Your stars help similar roles rank better in later searches. Expand a job for evidence and gaps.');
html=html.replace('<div id="joblist"></div>', '<label for="sortjobs">Sort jobs</label><select id="sortjobs" class="ranking"><option value="personalized">Personalized recommendation</option><option value="ai">AI fit score</option><option value="stars">Your star rating</option></select><p id="learning" class="hint"></p><div id="joblist"></div>');
html=html.replace("jobs.forEach(job=>{", "jobs.sort((a,b)=>$('sortjobs').value==='ai'?(b.ai_match?.score??-1)-(a.ai_match?.score??-1):$('sortjobs').value==='stars'?(b.owner_rating??0)-(a.owner_rating??0):(b.personalized_score??-1)-(a.personalized_score??-1));$('learning').textContent=(state.results.preference_learning?.rated_jobs||0)+' rated jobs · Local preference learning · 1 = not interested, 3 = neutral, 5 = very interested.';jobs.forEach(job=>{");
html=html.replace("if(job.ai_match){", "renderRatingRow(card,job);if(job.ai_match){");
html=html.replace("addText(card,'div',match.score+'/100 · '+match.band+' fit','number');", "");
const js=`
function renderRatingRow(card,job){
 const row=addText(card,'div','','score-row');const ai=addText(row,'div','');
 addText(ai,'div','AI resume fit','label');addText(ai,'div',job.ai_match?job.ai_match.score+'/100 · '+job.ai_match.band:'Not assessed','number');
 addText(ai,'small',job.personalized_score===null?'Awaiting AI assessment':'Personalized ranking: '+job.personalized_score+'/100 · Preference '+(job.preference_adjustment>=0?'+':'')+job.preference_adjustment,'muted');
 const rating=addText(row,'div','');addText(rating,'div','Your interest','label');const stars=addText(rating,'div','','stars');stars.setAttribute('role','group');stars.setAttribute('aria-label','Rate interest in '+job.title);
 for(let value=1;value<=5;value++){
  const button=addText(stars,'button','★','star'+(value<=(job.owner_rating||0)?' selected':''));button.type='button';button.title=value+' star'+(value===1?'':'s');button.setAttribute('aria-label','Rate '+value+' out of 5 stars');button.setAttribute('aria-pressed',String(value===job.owner_rating));button.onclick=()=>saveStars(job,value,stars);
 }
 addText(rating,'div',job.owner_rating?job.owner_rating+'/5 stars saved':'Not rated yet','rating-note');
 if(job.owner_rating){const clear=addText(rating,'button','Clear rating','clear-rating');clear.type='button';clear.onclick=()=>saveStars(job,null,stars)}
}
async function saveStars(job,rating,container){
 container.querySelectorAll('button').forEach(button=>button.disabled=true);
 try{await api('/api/ratings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({job_id:job.id||job.url,rating})});const updated=await api('/api/state');state.results=updated.results;renderJobs();message(rating===null?'Rating cleared. Preference ranking updated.':'Saved '+rating+'/5 stars. Preference ranking updated; AI fit remains unchanged.')}
 catch(error){container.querySelectorAll('button').forEach(button=>button.disabled=false);message('Rating not saved: '+error.message,true)}
}
$('sortjobs').onchange=renderJobs;
`;
html=html.replace('</script>',js+'</script>');fs.writeFileSync(file,html);fs.writeFileSync(path.join(__dirname,'browser-check.js'),html.match(/<script>([\s\S]*?)<\/script>/)[1]);
