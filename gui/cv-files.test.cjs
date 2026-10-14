const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const {listCvFiles}=require('./cv-files.cjs');
test('lists folder CVs and uploads while excluding temporary, test, and unsupported files',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-folder-'));const dir=path.join(root,'Jobs/Jobs (2026)');const uploads=path.join(root,'Jobs/Uploaded');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(uploads,{recursive:true});
 for(const name of ['CV_A.docx','Resume_B.docx','CV_C.pdf','~$CV_A.docx','CoverLetter.docx'])fs.writeFileSync(path.join(dir,name),'fixture');
 fs.writeFileSync(path.join(uploads,'uuid-custom.docx'),'fixture');fs.writeFileSync(path.join(uploads,'uuid-cv-upload-test.docx'),'fixture');
 assert.deepEqual(listCvFiles(root),['Jobs/Jobs (2026)/CV_A.docx','Jobs/Jobs (2026)/Resume_B.docx','Jobs/Uploaded/uuid-custom.docx']);
});
