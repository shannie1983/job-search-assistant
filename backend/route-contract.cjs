const MAIN_ROUTES = Object.freeze([
  'GET /', 'GET /tailor.js', 'GET /master-resume.js', 'GET /api/state',
  'GET /api/document', 'GET /api/ai/status', 'POST /api/ai/configure',
  'GET /api/cv-files', 'POST /api/cv-upload', 'POST /api/cv-dehighlight',
  'GET /api/tailor/drafts', 'GET /api/tailor/:id', 'POST /api/tailor',
  'POST /api/tailor/:id', 'POST /api/tailor/:id/export', 'GET /downloads/:draft/:revision/:file',
  'GET /word-cv/:id/cv_no_highlight.docx', 'POST /api/ratings',
  'POST /api/codex-search', 'POST /api/search', 'POST /api/preferences',
  'POST /api/alerts', 'POST /api/preference-modes', 'POST /api/tracking',
  'ALL /interview/*', 'GET /api/health'
]);

const INTERVIEW_ROUTES = Object.freeze([
  'GET /', 'GET /app.js', 'GET /style.css', 'GET /api/inventory', 'GET /api/sessions',
  'GET /api/recording', 'GET /api/cv', 'GET /voice/:id.wav',
  'GET /answer-audio/:id/:file', 'GET /api/job', 'GET /api/profiles', 'GET /api/ai-status',
  'POST /api/material-upload', 'POST /api/record-answer', 'POST /api/prepare',
  'POST /api/interviewer-research', 'POST /api/profile', 'POST /api/session-outcome',
  'POST /api/transcribe', 'POST /api/assess', 'POST /api/voice', 'POST /api/ai',
  'POST /api/session', 'GET /api/health'
]);

module.exports = { MAIN_ROUTES, INTERVIEW_ROUTES };
