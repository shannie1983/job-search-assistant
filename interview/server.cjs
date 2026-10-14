const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const engine=require('./engine.cjs');const {draftFile}=require('../gui/tailor.cjs');const {jsonSender,publicError,requestUrl}=require('../backend/http.cjs');const {INTERVIEW_ROUTES}=require('../backend/route-contract.cjs');const root=path.resolve(__dirname,'..');
const server=http.createServer(async(req,res)=>{const send=jsonSender(res,'interview');try{
 const url=requestUrl(req,8770);
 if(req.method==='GET'&&url.pathname==='/api/health')return send(200,{service:'interview',status:'ok',routes:INTERVIEW_ROUTES.length});
 if(req.method==='GET'){
  if(['/','/app.js','/style.css'].includes(url.pathname)){const file=url.pathname==='/'?'index.html':url.pathname.slice(1);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,file)));}
  if(url.pathname==='/api/inventory')return send(200,engine.inventory(root));
  if(url.pathname==='/api/sessions')return send(200,require('./sessions.cjs').list(root));
  if(url.pathname==='/api/recording'){const id=url.searchParams.get('id');if(!/^[0-9a-f-]{36}$/.test(id||''))throw Error('Invalid recording');const dir=path.join(root,'outputs/interview/recordings',id);const name=fs.readdirSync(dir).find(n=>/^answer\.(webm|mp4|wav|mp3)$/.test(n));if(!name)throw Error('Recording not found');return send(200,{url:'/answer-audio/'+id+'/'+name});}
  if(url.pathname==='/api/cv')return send(200,{paragraphs:await engine.cvText(root,url.searchParams.get('file'))});
  const voice=url.pathname.match(/^\/voice\/([0-9a-f-]{36})\.wav$/);
  const answerAudio=url.pathname.match(/^\/answer-audio\/([0-9a-f-]{36})\/(answer\.(?:webm|mp4|wav|mp3))$/);
  if(answerAudio){const file=path.join(root,'outputs/interview/recordings',answerAudio[1],answerAudio[2]);if(!fs.existsSync(file))return send(404,{error:'Recording not found'});res.writeHead(200,{'Content-Type':answerAudio[2].endsWith('.webm')?'audio/webm':answerAudio[2].endsWith('.mp4')?'audio/mp4':answerAudio[2].endsWith('.mp3')?'audio/mpeg':'audio/wav'});return fs.createReadStream(file).pipe(res);}
  if(voice){const file=path.join(root,'outputs/interview/voice',voice[1]+'.wav');if(!fs.existsSync(file))return send(404,{error:'Voice recording not found'});res.writeHead(200,{'Content-Type':'audio/wav','Cache-Control':'no-store'});return fs.createReadStream(file).pipe(res);}
  if(url.pathname==='/api/job'){const d=JSON.parse(fs.readFileSync(draftFile(root,url.searchParams.get('id')),'utf8'));return send(200,d.job);}
  if(url.pathname==='/api/profiles'){const dir=path.join(root,'outputs/interview');return send(200,fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'))).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)):[]);}
  if(url.pathname==='/api/ai-status'){try{const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(3000)});if(!response.ok)throw Error();const data=await response.json();return send(200,{connected:true,models:(data.models||[]).map(m=>m.name).filter(n=>!n.includes('cloud'))});}catch{return send(200,{connected:false,models:[]});}}
 }
 if(req.method==='POST'){
  if(req.headers.origin&&!['http://127.0.0.1:8770','http://localhost:8770'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
  if(url.pathname==='/api/material-upload'){
   const category=String(req.headers['x-material-category']||'');if(!['cv','job','company'].includes(category))return send(400,{error:'Invalid material category'});
   const original=decodeURIComponent(String(req.headers['x-file-name']||''));const extension=path.extname(original).toLowerCase();if(!['.docx','.txt','.md'].includes(extension))return send(415,{error:'Use a DOCX, TXT, or Markdown file'});
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return send(413,{error:'File exceeds 10 MB'});chunks.push(chunk);}if(!size)throw Error('File is empty');
   const folder=path.join(root,'outputs/interview/uploads');fs.mkdirSync(folder,{recursive:true});const name=category+'-'+crypto.randomUUID()+extension;const file=path.join(folder,name);fs.writeFileSync(file,Buffer.concat(chunks));
   try{const paragraphs=await engine.textFromFile(file);const text=paragraphs.map(p=>p.text).join('\n');if(!text.trim())throw Error('No readable text was found in the file');return send(200,{path:'outputs/interview/uploads/'+name,text,paragraphs});}catch(error){fs.unlinkSync(file);throw error;}
  }
  if(url.pathname==='/api/record-answer'){
   const type=(req.headers['content-type']||'').split(';')[0];const extension={'audio/webm':'webm','audio/mp4':'mp4','audio/wav':'wav','audio/x-wav':'wav','audio/mpeg':'mp3'}[type];if(!extension)return send(415,{error:'Upload an audio recording (WebM, MP4, WAV or MP3)'});
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>25*1024*1024)return send(413,{error:'Recording exceeds 25 MB'});chunks.push(chunk);}if(!size)throw Error('Recording is empty');const id=crypto.randomUUID();const folder=path.join(root,'outputs/interview/recordings',id);fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'answer.'+extension);fs.writeFileSync(file,Buffer.concat(chunks));return send(200,{id,url:'/answer-audio/'+id+'/answer.'+extension});
  }
  if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON required'});let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>300000)return send(413,{error:'Request too large'});}const input=JSON.parse(body);
  if(url.pathname==='/api/prepare'){const paragraphs=await engine.cvText(root,input.cv);if(typeof input.job?.description!=='string'||input.job.description.length<50||input.job.description.length>40000)throw Error('Provide a full job description');return send(200,{...engine.prepare(paragraphs,input.job),paragraphs});}
  if(url.pathname==='/api/interviewer-research'){const module=require('./interviewer-research.cjs');const result=await module.research(input);return send(200,module.saveResearch(root,input,result));}
  if(url.pathname==='/api/profile')return send(200,engine.saveProfile(root,input));
  if(url.pathname==='/api/session-outcome')return send(200,require('./sessions.cjs').outcome(root,input));
  if(url.pathname==='/api/transcribe'){
   if(!/^[0-9a-f-]{36}$/.test(input.id||''))throw Error('Invalid recording');const folder=path.join(root,'outputs/interview/recordings',input.id);const name=fs.readdirSync(folder).find(n=>/^answer\.(webm|mp4|wav|mp3)$/.test(n));if(!name)throw Error('Recording not found');
   const result=await new Promise((resolve,reject)=>{const child=require('node:child_process').spawn(process.env.PYTHON||'python',[path.join(__dirname,'transcribe.py'),path.join(folder,name)],{windowsHide:true});let stdout='';const timer=setTimeout(()=>{child.kill();reject(Error('Local transcription timed out; keep your recording and type the transcript instead.'))},180000);child.stdout.on('data',data=>stdout+=data);child.on('error',e=>{clearTimeout(timer);reject(e)});child.on('close',code=>{clearTimeout(timer);if(code)return reject(Error('Local transcription failed. Keep the recording and enter the transcript manually.'));try{resolve(JSON.parse(stdout))}catch{reject(Error('Invalid transcription response'))}});});fs.writeFileSync(path.join(folder,'transcript.json'),JSON.stringify(result,null,2));return send(200,result);
  }
  if(url.pathname==='/api/assess'){
   const assessment=await require('./assessment.cjs').assess(input);if(/^[0-9a-f-]{36}$/.test(input.recording_id||'')){const folder=path.join(root,'outputs/interview/recordings',input.recording_id);if(fs.existsSync(folder))fs.writeFileSync(path.join(folder,'assessment-'+crypto.randomUUID()+'.json'),JSON.stringify({question:input.question,answer:input.answer,...assessment},null,2));}return send(200,assessment);
  }
  if(url.pathname==='/api/voice'){
   if(typeof input.text!=='string'||!input.text.trim()||input.text.length>4000)throw Error('Voice text must contain 1–4000 characters');
   const id=crypto.randomUUID();const folder=path.join(root,'outputs/interview/voice');fs.mkdirSync(folder,{recursive:true});const request=path.join(folder,id+'.json');const output=path.join(folder,id+'.wav');fs.writeFileSync(request,JSON.stringify({text:input.text,voice:String(input.voice||'').slice(0,100),output}));
   await new Promise((resolve,reject)=>{const child=require('node:child_process').spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'speak.ps1'),'-RequestFile',request],{windowsHide:true,stdio:'ignore'});const timer=setTimeout(()=>{child.kill();reject(Error('Local voice generation timed out'))},30000);child.on('error',error=>{clearTimeout(timer);reject(error)});child.on('close',code=>{clearTimeout(timer);code?reject(Error('Windows local voice is unavailable')):resolve()});});
   return send(200,{url:'/voice/'+id+'.wav'});
  }
  if(url.pathname==='/api/ai'){if(['cv','job','question','answer'].some(k=>typeof input[k]!=='string'))throw Error('Invalid interview context');return send(200,{text:await engine.localAi(input)});}
  if(url.pathname==='/api/session')return send(200,require('./sessions.cjs').save(root,input));
 }return send(404,{error:'Not found'});
 }catch(error){const publicFailure=publicError(error,error.message==='fetch failed'?'Ollama is unavailable. Start Ollama and download a local model.':error.message||'Unable to complete interview request');return send(publicFailure.status,{error:publicFailure.message});}});
server.listen(8770,'127.0.0.1',()=>console.log('Interview preparation: http://127.0.0.1:8770'));
