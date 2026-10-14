const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { discover, searchLinks } = require('./search.cjs');
const { attachMatches } = require('./matches.cjs');
const { readRatings, saveRating, personalize } = require('./ratings.cjs');
const { createDraft, saveDraft, exportDraft, draftFile, listDrafts, documentOperation, extractKeywords, cvJobMatch } = require('./tailor.cjs');
const { listCvFiles } = require('./cv-files.cjs');
const openaiTailor=require('./openai-tailor.cjs');
const { scoreAndFilter }=require('./backend-score.cjs');
const codexSearch=require('./codex-search.cjs');
const { jsonSender, requestUrl } = require('../backend/http.cjs');
const { MAIN_ROUTES } = require('../backend/route-contract.cjs');
let searchRunning = false;
const root = path.resolve(__dirname, '..');
const configFile = path.join(root, 'config/preferences.json');
const preferencesMarkdownFile = path.join(root, 'config/job-preferences.md');
const trackingFile = path.join(root, 'data/applications/tracking.json');
const resultFile = path.join(root, 'outputs/results.json');
const documentTraceFile = path.join(root, 'outputs/document-trace.json');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const markdownList = values => values?.length ? values.map(value=>`- ${value}`).join('\n') : '- Not specified';
function preferencesMarkdown(p) { const salary=p.salary||{},m=p.preference_modes||{};return `# Job Search Preferences\n\nThis file is the instruction source for Codex internet job discovery. Blank fields are not requirements. Codex should search the open web and official employer career pages; it is not restricted to a user-maintained source list.\n\n## Target roles\n${markdownList(p.target_roles)}\n\n## Keywords\n${markdownList(p.keywords)}\n\n## Preferred locations\n${markdownList(p.preferred_locations)}\n\n## Match rules\n- Target roles: ${m.target_roles||'preferred'}\n- Keywords: at least one configured keyword must match; more matches rank higher\n- Preferred locations: required whenever one or more locations are configured\n- United States only; exclude worldwide or multinational location lists\n- Reject a job only when its stated minimum experience exceeds the saved experience\n\n## Experience and compensation\n- Total self-reported experience: ${p.experience_years??'Not specified'}\n- Minimum salary: ${salary.minimum??'Not specified'}\n- Maximum salary: ${salary.maximum??'Not specified'}\n- Currency: ${salary.currency||'USD'}\n\n## Employment types\n${markdownList(p.employment_types)}\n\n## Preferred industries\n${markdownList(p.preferred_industries)}\n\n## Work arrangements\n${markdownList(p.work_arrangements)}\n\n## Skills\n${markdownList(p.skills)}\n\n## Codex search instructions\n- Search the internet broadly; prefer official employer pages and USAJOBS.\n- Record the exact job URL, employer, title, location, checked time, requirements, and deadline.\n- Deduplicate by job ID or canonical URL.\n- Configured locations and locked preferences are mandatory.\n- Rank documented resume-to-job evidence at 75% and preference alignment at 25%.\n- Return at most the top 10 verified job postings.\n\n## Resume\n- Master resume: ${p.master_resume?`\`${p.master_resume}\``:'Not specified'}\n- Maximum pages: ${p.max_resume_pages??'Not specified'}\n`; }
const documents = ['PROJECT.md', 'AGENTS.md', 'SKILLS.md', 'PERMISSIONS_AND_WORKFLOW.md', 'RUN_STATUS.md'];
const documentPurpose={
  'PROJECT.md':'Project scope and success criteria',
  'AGENTS.md':'Agent operating rules and safeguards',
  'SKILLS.md':'Stage-specific execution guidance',
  'PERMISSIONS_AND_WORKFLOW.md':'Authorization and workflow boundaries',
  'RUN_STATUS.md':'Current implementation and run status'
};
function updateDocumentTrace(){
  let saved={documents:{},events:[]};if(fs.existsSync(documentTraceFile))try{saved=readJson(documentTraceFile)}catch{}
  for(const name of documents){const file=path.join(root,name);if(!fs.existsSync(file))continue;const stat=fs.statSync(file),hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');const previous=saved.documents[name];
    if(!previous){saved.events.push({document:name,type:'Built / first traced',time:stat.birthtime.toISOString(),detail:documentPurpose[name]});if(Math.abs(stat.mtimeMs-stat.birthtimeMs)>1000)saved.events.push({document:name,type:'Modified',time:stat.mtime.toISOString(),detail:'Latest modification before tracing began'});}
    else if(previous.hash!==hash)saved.events.push({document:name,type:'Modified',time:stat.mtime.toISOString(),detail:'Document content changed'});
    saved.documents[name]={name,purpose:documentPurpose[name],created_at:stat.birthtime.toISOString(),modified_at:stat.mtime.toISOString(),size:stat.size,hash};
  }
  saved.events=saved.events.sort((a,b)=>b.time.localeCompare(a.time)).slice(0,200);fs.mkdirSync(path.dirname(documentTraceFile),{recursive:true});fs.writeFileSync(documentTraceFile,JSON.stringify(saved,null,2));return {documents:documents.map(name=>saved.documents[name]).filter(Boolean),events:saved.events};
}
const server = http.createServer(async (req, res) => {
  const send = jsonSender(res, 'main');
  const request = requestUrl(req, 8765);
  try {
    if(req.method==='GET'&&request.pathname==='/api/health')return send(200,{service:'main',status:'ok',routes:MAIN_ROUTES.length,interview_proxy:'/interview/'});
    if(req.url.startsWith('/interview/')){
      if(req.headers.origin&&!['http://127.0.0.1:8765','http://localhost:8765'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
      const forward=http.request({hostname:'127.0.0.1',port:8770,path:req.url.slice('/interview'.length),method:req.method,headers:{...req.headers,host:'127.0.0.1:8770',...(req.headers.origin?{origin:'http://127.0.0.1:8770'}:{})}},response=>{
        res.writeHead(response.statusCode,{'Content-Type':response.headers['content-type']||'application/octet-stream','Cache-Control':'no-store'});
        if((response.headers['content-type']||'').includes('text/html')){let html='';response.on('data',chunk=>html+=chunk);response.on('end',()=>res.end(html.replace('<head>','<head><base href="/interview/">').replace('href="/style.css"','href="style.css"').replace('src="/app.js"','src="app.js"')));}else response.pipe(res);
      });forward.on('error',()=>{if(!res.headersSent)send(503,{error:'Interview service is unavailable. Start interview/server.cjs.'});else res.end();});req.pipe(forward);return;
    }
    if(req.method==='GET'&&req.url==='/api/ai/status')return send(200,openaiTailor.status());
    if(req.method==='POST'&&req.url==='/api/ai/configure'){
      if(req.headers.origin&&!['http://127.0.0.1:8765','http://localhost:8765'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
      if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON required'});
      let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Request too large'})}
      try{return send(200,openaiTailor.configure(JSON.parse(body)))}catch(error){return send(400,{error:error.message})}
    }
    if(req.method==='POST'&&req.url==='/api/cv-dehighlight'){
      if(req.headers.origin&&!['http://127.0.0.1:8765','http://localhost:8765'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
      if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'DOCX required'});
      if(!/\.docx$/i.test(decodeURIComponent(req.headers['x-file-name']||'')))return send(400,{error:'Upload the DOCX saved from Word'});
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return send(413,{error:'DOCX must be 10 MB or smaller'});chunks.push(chunk)}
      const id=crypto.randomUUID();const folder=path.join(root,'outputs/word-reviewed',id);fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'input.docx');fs.writeFileSync(file,Buffer.concat(chunks));
      try{const validation=await documentOperation({operation:'strip_highlights',master:file,output:path.join(folder,'cv_no_highlight.docx')});return send(200,{validation,url:'/word-cv/'+id+'/cv_no_highlight.docx'})}catch(error){return send(400,{error:error.message})}
    }
    const wordDownload=req.url.match(/^\/word-cv\/([0-9a-f-]{36})\/cv_no_highlight\.docx$/);
    if(req.method==='GET'&&wordDownload){const file=path.join(root,'outputs/word-reviewed',wordDownload[1],'cv_no_highlight.docx');if(!fs.existsSync(file))return send(404,{error:'File not found'});res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="cv_no_highlight.docx"','Cache-Control':'no-store'});return fs.createReadStream(file).pipe(res)}
    if(req.method==='GET'&&req.url==='/api/cv-files')return send(200,{files:listCvFiles(root),default_master:readJson(configFile).master_resume});
    if(req.method==='POST'&&req.url==='/api/cv-upload'){
      if(req.headers.origin&&!['http://127.0.0.1:8765','http://localhost:8765'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
      if(req.headers['content-type']!=='application/octet-stream')return send(415,{error:'A DOCX file is required'});
      let filename;try{filename=decodeURIComponent(req.headers['x-file-name']||'')}catch{return send(400,{error:'Invalid filename'})}
      if(!/\.docx$/i.test(filename))return send(400,{error:'Attach a DOCX CV. PDF import is not supported for tracked editing.'});
      let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return send(413,{error:'CV must be 10 MB or smaller'});chunks.push(chunk)}
      if(!size)return send(400,{error:'The file is empty'});
      const directory=path.join(root,'Jobs/Uploaded');fs.mkdirSync(directory,{recursive:true});
      const safeName=path.basename(filename).replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);const relative='Jobs/Uploaded/'+crypto.randomUUID()+'-'+safeName;const file=path.join(root,relative);
      fs.writeFileSync(file,Buffer.concat(chunks));
      try{const doc=await documentOperation({operation:'read',master:file});return send(200,{master_resume:relative,filename,paragraphs:doc.paragraphs.filter(p=>p.text.trim()).length,message:'CV attached locally for this draft. Default master preference unchanged.'})}
      catch(error){fs.unlinkSync(file);return send(400,{error:'Unable to use this CV: '+error.message})}
    }
    if (req.method === 'GET' && req.url === '/tailor.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });return res.end(fs.readFileSync(path.join(__dirname,'tailor-ui.js')));
    }
    if(req.method==='GET'&&req.url==='/master-resume.js'){
      res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'master-resume-ui.js')));
    }
    if (req.method === 'GET' && req.url === '/api/tailor/drafts') {
      return send(200,{drafts:listDrafts(root)});
    }
    const draftRoute=req.url.match(/^\/api\/tailor\/([0-9a-f-]{36})$/);
    if(req.method==='GET'&&draftRoute){const draft=readJson(draftFile(root,draftRoute[1]));if(!Array.isArray(draft.keywords))draft.keywords=extractKeywords(draft.job);draft.cv_job_match=cvJobMatch(draft);return send(200,draft)}
    const download=req.url.match(/^\/downloads\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/(cv_tracked_highlighted\.docx|cv_tracked\.docx|cv_final\.docx|job_description\.md|company_information\.md|star_stories\.md)$/);
    if(req.method==='GET'&&download){
      const file=path.join(path.dirname(draftFile(root,download[1])),download[2],download[3]);
      if(!fs.existsSync(file))return send(404,{error:'Export not found'});
      const contentType=download[3].endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/markdown; charset=utf-8';res.writeHead(200,{'Content-Type':contentType,'Content-Disposition':'attachment; filename="'+download[3]+'"','Cache-Control':'no-store'});return fs.createReadStream(file).pipe(res);
    }
    const tailorWrite=req.url.match(/^\/api\/tailor(?:\/([0-9a-f-]{36})(\/export)?)?$/);
    if(req.method==='POST'&&tailorWrite){
      if(req.headers.origin&&!['http://127.0.0.1:8765','http://localhost:8765'].includes(req.headers.origin))return send(403,{error:'Origin denied'});
      if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON required'});
      let body='';for await(const chunk of req){body+=chunk;if(body.length>250000)return send(413,{error:'Request too large'})}
      const input=JSON.parse(body);
      try{
        if(!tailorWrite[1])return send(200,await createDraft(root,readJson(configFile),input));
        const draft=saveDraft(root,tailorWrite[1],input);
        if(!tailorWrite[2])return send(200,draft);
        const exported=await exportDraft(root,draft.id);
        return send(200,{draft_id:draft.id,revision:exported.revision,validation:exported.validation,final_documents_path:exported.final_documents_path,interview_profile_id:exported.interview_profile_id,layout_status:'Not rendered: page count and visual layout are unverified. Review in Word before submission.',files:exported.files.map(name=>({name,url:'/downloads/'+draft.id+'/'+exported.revision+'/'+name}))});
      }catch(error){return send(400,{error:error.message})}
    }
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    if (req.method === 'GET' && req.url === '/api/state') {
      const candidates = listCvFiles(root);
      const preferences = readJson(configFile);
      return send(200, { preferences, preferences_markdown: fs.existsSync(preferencesMarkdownFile)?fs.readFileSync(preferencesMarkdownFile,'utf8'):preferencesMarkdown(preferences), application_tracking: fs.existsSync(trackingFile)?readJson(trackingFile):[], results: personalize(attachMatches(readJson(resultFile), preferences, root), readRatings(root)), candidates, documents, document_trace:updateDocumentTrace(), search_links: searchLinks(preferences), fetched_at: new Date().toISOString() });
    }
    if (req.method === 'GET' && req.url.startsWith('/api/document?')) {
      const name = new URL(req.url, 'http://localhost').searchParams.get('name');
      if (!documents.includes(name)) return send(404, { error: 'Document not available' });
      return send(200, { name, content: fs.readFileSync(path.join(root, name), 'utf8') });
    }
    if (req.method === 'POST' && req.url === '/api/ratings') {
      if (req.headers.origin && !['http://127.0.0.1:8765', 'http://localhost:8765'].includes(req.headers.origin)) return send(403, { error: 'Origin denied' });
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Request too large'})}
      const input=JSON.parse(body);
      if(input.rating!==null&&(!Number.isInteger(input.rating)||input.rating<1||input.rating>5))return send(400,{error:'Choose 1–5 stars'});
      const job=readJson(resultFile).jobs.find(j=>(j.id||j.url)===input.job_id);
      if(!job)return send(404,{error:'Job not found'});
      saveRating(root,job,input.rating);
      return send(200,{saved:true,job_id:input.job_id,rating:input.rating});
    }
    if (req.method === 'POST' && req.url === '/api/codex-search') {
      if (req.headers.origin && !['http://127.0.0.1:8765', 'http://localhost:8765'].includes(req.headers.origin)) return send(403, { error: 'Origin denied' });
      if(searchRunning)return send(409,{error:'A search is already running'});searchRunning=true;
      try{return send(200,await codexSearch.run(root))}catch(error){return send(502,{error:error.message})}finally{searchRunning=false}
    }
    if (req.method === 'POST' && req.url === '/api/search') {
      if (req.headers.origin && !['http://127.0.0.1:8765', 'http://localhost:8765'].includes(req.headers.origin)) return send(403, { error: 'Origin denied' });
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      if (searchRunning) return send(409, { error: 'A search is already running' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 4096) return send(413, { error: 'Request too large' }); }
      const { provider } = JSON.parse(body);
      const preferences = readJson(configFile);
      if (!preferences.target_roles.length && !preferences.keywords.length) return send(400, { error: 'Save at least one target role or keyword first' });
      searchRunning = true;
      try {
        const result = await discover(provider, preferences, root);
        const previous = readJson(resultFile);
        const existing = new Map(previous.jobs.map(j => [j.id || j.url, j]));
        for (const job of result.jobs) {
          const old = existing.get(job.id);
          existing.set(job.id, old ? { ...job, status: old.status, review: old.review } : job);
        }
        const next = { ...previous, updated_at: result.checked_at, run_status: result.jobs.length ? 'Internet search completed' : 'Search completed — no keyword matches', summary: `${result.jobs.length} preference candidates from ${result.fetched_count} ${provider} postings. ${result.note}`, jobs: [...existing.values()], source_note: result.note, runs: [...previous.runs, { date: result.checked_at, title: `${provider} internet search`, status: 'Completed', description: `${result.jobs.length} candidates. ${result.note}` }] };
        const evaluated=attachMatches(next,preferences,root);const qualified=evaluated.jobs.length;
        next.run_status=qualified?`Found ${qualified} ranked documented matches`:'No jobs met the locked preferences — continuing configured sources when available';
        next.summary=qualified?`${qualified} top documented matches (maximum 10). Resume evidence is weighted 75%; preferences 25%; locked preferences are mandatory.`:`No jobs met the locked preferences after ${result.fetched_count} ${provider} postings. Other configured API sources will be tried when credentials/access are available.`;
        fs.writeFileSync(resultFile + '.tmp', JSON.stringify(next, null, 2));fs.renameSync(resultFile + '.tmp', resultFile);
        return send(200, {...result,qualified_count:qualified,note:next.summary});
      } catch (error) {
        const previous = readJson(resultFile);
        previous.run_status = 'Search failed — previous results preserved';
        previous.runs.push({ date: new Date().toISOString(), title: `${provider} internet search`, status: 'Failed', description: error.message });
        fs.writeFileSync(resultFile, JSON.stringify(previous, null, 2));
        return send(502, { error: error.message });
      } finally { searchRunning = false; }
    }
    if (req.method === 'POST' && req.url === '/api/preferences') {
      if (req.headers.origin && !['http://127.0.0.1:8765', 'http://localhost:8765'].includes(req.headers.origin)) return send(403, { error: 'Origin denied' });
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 32768) return send(413, { error: 'Request too large' }); }
      const input = JSON.parse(body);
      for (const field of ['target_roles', 'preferred_locations', 'work_arrangements', 'sources', 'keywords', 'employment_types', 'preferred_industries']) {
        if (!Array.isArray(input[field]) || input[field].some(x => typeof x !== 'string' || x.length > 500)) return send(400, { error: `Invalid ${field}` });
      }
      if (!input.salary || !['USD','CAD','EUR','GBP'].includes(input.salary.currency)) return send(400, { error: 'Choose a supported salary currency' });
      for (const amount of [input.salary.minimum,input.salary.maximum]) if (amount !== null && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 10000000)) return send(400, { error: 'Salary values must be between 0 and 10,000,000 or blank' });
      if (input.salary.minimum !== null && input.salary.maximum !== null && input.salary.maximum < input.salary.minimum) return send(400, { error: 'Maximum salary must be at least the minimum salary' });
      if (input.max_resume_pages !== null && (!Number.isInteger(input.max_resume_pages) || input.max_resume_pages < 1 || input.max_resume_pages > 30)) return send(400, { error: 'Page limit must be 1–30 or blank' });
      if (typeof input.master_resume !== 'string' && input.master_resume !== null) return send(400, { error: 'Invalid master resume' });
      if (input.master_resume) {
        const selected = path.resolve(root, input.master_resume);
        if (!selected.startsWith(path.join(root, 'Jobs') + path.sep) || !fs.existsSync(selected) || !/\.(docx|pdf)$/i.test(selected)) return send(400, { error: 'Select an existing resume inside Jobs' });
      }
      const current = readJson(configFile);
      const experienceYears = input.experience_years === undefined ? (current.experience_years ?? null) : input.experience_years;
      const skills = input.skills === undefined ? (current.skills || []) : input.skills;
      if (experienceYears !== null && (typeof experienceYears !== 'number' || !Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 80)) return send(400, { error: 'Work experience must be between 0 and 80 years, or blank' });
      if (!Array.isArray(skills) || skills.length > 100 || skills.some(skill => typeof skill !== 'string' || !skill.trim() || skill.length > 100)) return send(400, { error: 'Enter up to 100 skills, each at most 100 characters' });
      const next = { ...current, target_roles: input.target_roles, keywords: input.keywords, preferred_locations: input.preferred_locations, employment_types: input.employment_types, preferred_industries: input.preferred_industries, salary: input.salary, work_arrangements: input.work_arrangements, sources: input.sources, master_resume: input.master_resume, max_resume_pages: input.max_resume_pages, updated_at: new Date().toISOString() };
      next.status = next.target_roles.length && next.master_resume ? 'configured_for_review' : 'incomplete';
      next.experience_years = experienceYears;
      next.skills = [...new Set(skills.map(skill => skill.trim()))];
      next.profile_source = 'self_reported';
      fs.writeFileSync(configFile + '.tmp', JSON.stringify(next, null, 2) + '\n');
      fs.renameSync(configFile + '.tmp', configFile);
      fs.writeFileSync(preferencesMarkdownFile + '.tmp', preferencesMarkdown(next));
      fs.renameSync(preferencesMarkdownFile + '.tmp', preferencesMarkdownFile);
      return send(200, { preferences: next });
    }
    if (req.method === 'POST' && req.url === '/api/alerts') {
      if (req.headers.origin && !['http://127.0.0.1:8765', 'http://localhost:8765'].includes(req.headers.origin)) return send(403, { error: 'Origin denied' });
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 8192) return send(413, { error: 'Request too large' }); }
      const input = JSON.parse(body);
      if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return send(400, { error: 'Enter a valid recipient email address' });
      if (!['daily', 'weekdays', 'weekly'].includes(input.frequency)) return send(400, { error: 'Choose a supported frequency' });
      if (input.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) return send(400, { error: 'Choose a valid send time' });
      if (!Array.isArray(input.providers) || !input.providers.length || input.providers.some(provider => !['remotive', 'usajobs'].includes(provider))) return send(400, { error: 'Choose at least one supported search source' });
      if (!Array.isArray(input.custom_sources) || input.custom_sources.length > 50 || input.custom_sources.some(source => typeof source !== 'string' || source.length > 500)) return send(400, { error: 'Enter up to 50 additional sources' });
      if (typeof input.timezone !== 'string' || input.timezone.length > 100) return send(400, { error: 'Enter a valid timezone' });
      try { if (input.timezone) new Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format(); } catch { return send(400, { error: 'Use an IANA timezone such as America/New_York' }); }
      if (input.enabled && (!input.frequency || !input.time || !input.timezone)) return send(400, { error: 'Frequency, time, and timezone are required before enabling scheduled searches' });
      const current = readJson(configFile);
      const schedules = Array.isArray(current.search_schedules) ? current.search_schedules : [];
      const id = input.id && schedules.some(schedule => schedule.id === input.id) ? input.id : crypto.randomUUID();
      const schedule = { id, enabled: Boolean(input.enabled), email: input.email || null, frequency: input.frequency, time: input.time, timezone: input.timezone || current.timezone, providers: [...new Set(input.providers)], custom_sources: [...new Set(input.custom_sources.map(source => source.trim()).filter(Boolean))], delivery_status: input.email ? 'awaiting_email_connection' : 'search_only', updated_at: new Date().toISOString() };
      const index = schedules.findIndex(item => item.id === id);
      if (index >= 0) schedules[index] = { ...schedules[index], ...schedule }; else schedules.push(schedule);
      current.search_schedules = schedules;
      current.updated_at = new Date().toISOString();
      fs.writeFileSync(configFile + '.tmp', JSON.stringify(current, null, 2) + '\n');
      fs.renameSync(configFile + '.tmp', configFile);
      return send(200, { preferences: current, message: input.email ? 'Scheduled search saved. Email delivery awaits an authorized Gmail, Outlook, or SMTP connection.' : 'Scheduled search saved. It will run while the local server is open.' });
    }
    if (req.method === 'POST' && req.url === '/api/preference-modes') {
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Request too large'})}
      const input=JSON.parse(body);const allowed=['target_roles','keywords','preferred_locations','sources'];
      if(Object.keys(input).some(key=>!allowed.includes(key))||allowed.some(key=>!['required','preferred'].includes(input[key])))return send(400,{error:'Invalid preference lock settings'});
      const current=readJson(configFile);current.preference_modes=input;current.updated_at=new Date().toISOString();fs.writeFileSync(configFile+'.tmp',JSON.stringify(current,null,2)+'\n');fs.renameSync(configFile+'.tmp',configFile);fs.writeFileSync(preferencesMarkdownFile,preferencesMarkdown(current));return send(200,{preferences:current});
    }
    if (req.method === 'POST' && req.url === '/api/tracking') {
      if (req.headers['content-type'] !== 'application/json') return send(415, { error: 'JSON required' });
      let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)return send(413,{error:'Request too large'})}
      const input=JSON.parse(body);if(!input.company||!input.role)return send(400,{error:'Company and job title are required'});if(!['Submitted','Interview','Offer','Rejected','Withdrawn'].includes(input.status))return send(400,{error:'Invalid status'});if(!['manual','email','phone'].includes(input.source))return send(400,{error:'Invalid update source'});if(input.source!=='manual')return send(400,{error:'Email or phone auto-fill requires an authorized connector; use Manual selection for now'});
      const items=fs.existsSync(trackingFile)?readJson(trackingFile):[];items.push({id:crypto.randomUUID(),company:String(input.company).slice(0,200),role:String(input.role).slice(0,200),status:input.status,source:input.source,notes:String(input.notes||'').slice(0,2000),updated_at:new Date().toISOString()});fs.mkdirSync(path.dirname(trackingFile),{recursive:true});fs.writeFileSync(trackingFile+'.tmp',JSON.stringify(items,null,2)+'\n');fs.renameSync(trackingFile+'.tmp',trackingFile);return send(200,{items});
    }
    return send(404, { error: 'Not found' });
  } catch (error) { return send(500, { error: error instanceof SyntaxError ? 'Invalid JSON' : 'Unable to complete request' }); }
});
function localScheduleParts(timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, weekday:'short', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(new Date()).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  return { date:`${parts.year}-${parts.month}-${parts.day}`, time:`${parts.hour}:${parts.minute}`, weekday:parts.weekday };
}
async function runDueSchedules() {
  const preferences = readJson(configFile);
  for (const schedule of preferences.search_schedules || []) {
    if (!schedule.enabled) continue;
    const local = localScheduleParts(schedule.timezone);
    const allowed = schedule.frequency === 'daily' || (schedule.frequency === 'weekdays' && !['Sat','Sun'].includes(local.weekday)) || (schedule.frequency === 'weekly' && local.weekday === 'Mon');
    if (!allowed || local.time < schedule.time || schedule.last_run_local_date === local.date) continue;
    let status = 'completed'; let detail = '';
    for (const provider of schedule.providers) {
      try { const response = await fetch('http://127.0.0.1:8765/api/search', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider}) }); const data=await response.json(); if(!response.ok) throw Error(data.error||'Search failed'); detail += `${provider}: ${data.jobs.length} matches. `; }
      catch (error) { status = 'failed'; detail += `${provider}: ${error.message}. `; }
    }
    const latest = readJson(configFile); const saved=(latest.search_schedules||[]).find(item=>item.id===schedule.id); if(saved){saved.last_run_local_date=local.date;saved.last_run_at=new Date().toISOString();saved.last_run_status=status;saved.last_run_detail=detail.trim();fs.writeFileSync(configFile+'.tmp',JSON.stringify(latest,null,2)+'\n');fs.renameSync(configFile+'.tmp',configFile)}
  }
}
server.listen(8765, '127.0.0.1', () => { console.log('Local GUI: http://127.0.0.1:8765'); runDueSchedules().catch(console.error); });
setInterval(()=>runDueSchedules().catch(console.error),60000).unref();
