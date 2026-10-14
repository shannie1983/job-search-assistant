const masterUpload=document.getElementById('master-upload');
const masterUploadStatus=document.getElementById('master-upload-status');
masterUpload.onchange=async()=>{
 const file=masterUpload.files[0];if(!file)return;
 if(!/\.docx$/i.test(file.name)||file.size>10*1024*1024){message('Choose a DOCX resume up to 10 MB.',true);masterUpload.value='';return}
 const save=document.querySelector('#prefs button[type="submit"]');save.disabled=true;masterUpload.disabled=true;masterUploadStatus.textContent='Uploading and validating your resume locally…';
 try{
  const result=await api('/api/cv-upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});
  const select=document.getElementById('master');if(![...select.options].some(o=>o.value===result.master_resume))select.add(new Option(result.master_resume,result.master_resume));select.value=result.master_resume;
  masterUploadStatus.textContent='Uploaded: '+file.name+'. Click Save preferences to make this your default master resume.';
  message('Resume uploaded locally and selected. Save preferences to apply it.');
 }catch(error){masterUploadStatus.textContent='Upload failed. Your previous selection is preserved.';message(error.message,true);masterUpload.value=''}
 finally{save.disabled=false;masterUpload.disabled=false}
};
document.getElementById('master-refresh').onclick=async()=>{
 try{const result=await api('/api/cv-files');const select=document.getElementById('master');const selected=select.value;select.replaceChildren(new Option('Choose a DOCX resume',''));result.files.forEach(file=>select.add(new Option(file,file)));if(selected&&![...select.options].some(o=>o.value===selected))select.add(new Option(selected,selected));select.value=selected;message('Resume folder list refreshed. Unsaved preferences are preserved.')}
 catch(error){message(error.message,true)}
};
document.getElementById('master').addEventListener('change',()=>{masterUpload.value='';masterUploadStatus.textContent='Selected: '+(document.getElementById('master').value||'None')+'. Click Save preferences to apply.'});

function showPreferenceApiStatus(settings){
 document.getElementById('pref-ai-model').value=settings.model;
 document.getElementById('pref-ai-status').textContent=settings.configured?'API key configured for this server session. Live generation and billing access have not been tested.':'No API key configured. Paste your key below and click Set API key for this session.';
 const tailorStatus=document.getElementById('cv-openai-status');if(tailorStatus)tailorStatus.textContent=settings.configured?'Key configured in Preferences for this server session.':'No API key configured.';
 const tailorModel=document.getElementById('cv-openai-model');if(tailorModel)tailorModel.value=settings.model;
}
document.getElementById('pref-ai-save').onclick=async()=>{
 const button=document.getElementById('pref-ai-save');button.disabled=true;
 try{const settings=await api('/api/ai/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:document.getElementById('pref-ai-key').value,model:document.getElementById('pref-ai-model').value})});document.getElementById('pref-ai-key').value='';showPreferenceApiStatus(settings);message('API key set in server memory. Go to Tailor CV, select OpenAI AI rewriting, and Prepare CV changes.')}
 catch(error){message(error.message,true)}finally{button.disabled=false}
};
document.getElementById('pref-ai-clear').onclick=async()=>{try{const settings=await api('/api/ai/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clear:true})});document.getElementById('pref-ai-key').value='';document.getElementById('cv-openai-key').value='';showPreferenceApiStatus(settings);message('API key cleared from this server session.')}catch(error){message(error.message,true)}};
document.getElementById('pref-ai-refresh').onclick=async()=>{try{showPreferenceApiStatus(await api('/api/ai/status'))}catch(error){message(error.message,true)}};
api('/api/ai/status').then(showPreferenceApiStatus).catch(error=>message(error.message,true));
