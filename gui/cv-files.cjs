const fs=require('node:fs');const path=require('node:path');
function listCvFiles(root){
 const files=[];const jobs=path.join(root,'Jobs');if(!fs.existsSync(jobs))return files;
 function walk(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){
  if(item.isSymbolicLink())continue;
  const full=path.join(directory,item.name);
  if(item.isDirectory())walk(full);
  else if(item.isFile()&&/\.docx$/i.test(item.name)&&!item.name.startsWith('~$')&&!/cv-upload-test\.docx$/i.test(item.name)&&(/resume|cv|short/i.test(item.name)||full.startsWith(path.join(jobs,'Uploaded')+path.sep)))files.push(path.relative(root,full).split(path.sep).join('/'));
 }}
 walk(jobs);return files.sort((a,b)=>a.localeCompare(b));
}
module.exports={listCvFiles};
