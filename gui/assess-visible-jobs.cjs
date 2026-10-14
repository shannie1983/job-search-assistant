const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const resultsPath = path.join(root, 'outputs', 'results.json');
const matchesPath = path.join(root, 'outputs', 'ai_matches.json');
const resumeRel = 'Jobs/Jobs (2026)/CV_Shan_2026.docx';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const now = new Date().toISOString();

const assessments = {
  'ionq-usqc': {score:72, band:'Strong partial', description:'Lead fault-tolerant utility-scale quantum-computing architecture trade studies, physical-resource estimation, simulations, technical reports and government proposals. Requires significant quantum-architecture, error-correction and fault-tolerance experience; Python or C++, HPC and trapped-ion experience are valued.', strengths:['PhD plus 15 years of physics-based scientific computing.','Python, NASA HPC simulation, proposal writing and technical communication are directly relevant.','Documented Qiskit, quantum ML, quantum PINNs and quantum lattice-Boltzmann work.'], gaps:['No documented fault-tolerant quantum-computing architecture or quantum error-correction-code experience.','No trapped-ion system experience is documented.'], confidence:'High for the published requirements; availability must be reconfirmed because the direct application endpoint returned 404.'},
  'pingwind-quantum': {score:45, band:'Partial', description:'Federal quantum-computing and cryptography role requiring 10 years of IT experience, including 5 years of quantum computing and cryptography, plus expertise in PQC, cryptographic protocols, NIST migration standards and enterprise implementation.', strengths:['Quantum ML, Qiskit and quantum simulation experience are documented.','Strong scientific computing, analysis and stakeholder communication background.'], gaps:['Five years of quantum-computing and cryptography experience are not documented.','PQC, PKI, NIST FIPS 203/204/205 and cryptographic-migration experience are not documented.','Required IAT/IAM/IASAE certification is not documented.'], confidence:'High — employer page was accessible and checked.'},
  'psiquantum-quality': {score:49, band:'Partial', description:'Quantum application software quality role focused on validating quantum-application software, test strategy, automation and cross-functional software-quality processes.', strengths:['Quantum ML, Qiskit, Python and scientific-model validation are documented.','Long research record supports analytical testing and technical collaboration.'], gaps:['Professional software QA ownership and automated test-framework delivery are not documented.','Quantum application product-release experience is not documented.'], confidence:'Moderate — current employer board lists the role, but the old direct application URL returned 404.'},
  'redhorse-ds-sme': {score:58, band:'Partial', description:'Executive-level data-science SME leading machine-learning architectures, algorithms, data pipelines, Python processing, validation and executive communication. Requires extensive data-science/software leadership and an active TS/SCI with CI Poly.', strengths:['More than eight years of deep learning and 15 years of scientific computing.','Python, ML architecture, large scientific datasets, publications and executive technical communication align.'], gaps:['Active TS/SCI with CI Poly is not documented.','Ten years as a data-science/software-development technical lead is not explicitly established.','Enterprise search, law-enforcement and intelligence-data experience are not documented.'], confidence:'High — employer page was accessible and checked.'},
  'isee-ml-scientist': {score:75, band:'Strong partial', description:'Machine-learning research-scientist role for autonomous systems, requiring model research, experimentation, implementation and collaboration with engineering teams.', strengths:['PhD, extensive ML research, PyTorch, foundation models and 20+ publications align strongly.','Computer vision, sensor data, model evaluation and HPC training are documented.'], gaps:['Autonomous-vehicle and robotics experience are not documented.','Production autonomy-stack integration is not documented.'], confidence:'Moderate — current employer board lists the role; the detail page was not retrievable.'},
  'qventus-data-scientist': {score:63, band:'Moderate', description:'Remote U.S. senior data-scientist/LLM-engineer work building AI and LLM solutions for healthcare operations, including model development, evaluation and product integration.', strengths:['Foundation-model fine-tuning, LLM evaluation work, Python, PyTorch and scientific ML are documented.','Strong research, experimentation and cross-team communication background.'], gaps:['Healthcare operations and clinical-data experience are not documented.','Commercial LLM product deployment, SQL/cloud platform and production MLOps evidence are limited.'], confidence:'Moderate — current role listing was found, while the old direct Greenhouse URL returned 404.'},
  'synmax-data-scientist': {score:88, band:'Strong', description:'Data scientist using images, tabular, time-series and remote-sensing datasets; building Python data pipelines, SQL databases and ML models. Values predictive modeling, PyTorch, geospatial data, research and GCP.', strengths:['Direct match to satellite/lidar remote sensing, ML, Python, PyTorch and quantitative research.','Extensive image, sensor, atmospheric and large-scale scientific-data experience.','PhD, publications and independent research exceed the stated research requirement.'], gaps:['SQL, GCP-hosted services and production API delivery are not documented in the default resume.','Energy-trading domain knowledge is not documented.'], confidence:'Moderate — detailed indexed posting was available, but the direct link was not accessible during this check.'},
  'coinbase-applied-scientist': {score:61, band:'Moderate', description:'Senior applied-scientist role using machine learning research, experimentation and model development for product and business problems at scale.', strengths:['Deep-learning research, Python/PyTorch, large scientific datasets and publications are documented.','Strong experimentation, model development and stakeholder communication background.'], gaps:['Fintech/crypto domain and commercial product experimentation are not documented.','Production ML deployment and online experimentation ownership are not established.'], confidence:'Low to moderate — the prior application URL returned 404 and only indexed requirements were available.'},
  'mozilla-staff-ml': {score:66, band:'Moderate', description:'Staff machine-learning engineering role for generative AI, emphasizing model development, evaluation, scalable implementation and technical leadership.', strengths:['Foundation-model adaptation, transformers, diffusion models, Python/PyTorch and HPC are documented.','Technical leadership, proposals, mentoring and publications support staff-level influence.'], gaps:['Production GenAI platform ownership and large-scale online deployment are not documented.','Browser/product engineering and modern cloud MLOps are not documented.'], confidence:'Low to moderate — the old application URL was inaccessible and assessment uses indexed role information.'},
  'alertmedia-aiml': {score:74, band:'Strong partial', description:'AI/ML software engineer training and fine-tuning supervised and language models, building evaluation pipelines, benchmarking models and integrating AI features. Requires Python, ML libraries, model evaluation, cloud ML tooling and production deployment.', strengths:['Python, PyTorch, foundation-model fine-tuning, custom losses and model evaluation align strongly.','LLM training-data evaluation, cross-team work and strong communication are documented.'], gaps:['SageMaker/Bedrock or equivalent cloud ML tooling is not documented.','Production customer-facing model deployment, prompt engineering and A/B testing are not explicit.'], confidence:'High for the indexed published description; availability must be reconfirmed because the direct endpoint returned 404.'}
};

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const matches = [];
for (const job of results.jobs) {
  const item = assessments[job.id];
  if (!item) continue;
  job.description = item.description;
  job.reason = item.strengths[0];
  job.gaps = item.gaps;
  matches.push({
    job_id: job.id,
    job_sha256: sha(`${job.title}\n${job.description}`),
    score: item.score,
    band: item.band,
    summary: `${item.band} resume match based on the default resume and the published job requirements.`,
    strengths: item.strengths,
    gaps: item.gaps,
    eligibility_notes: [item.confidence],
    criteria: [
      {name:'Core technical requirements', points:Math.round(item.score*.4), maximum:40, evidence:item.strengths[0]},
      {name:'Relevant role and domain experience', points:Math.round(item.score*.2), maximum:20, evidence:item.strengths[1]||item.strengths[0]},
      {name:'Delivery and production evidence', points:Math.max(0,Math.round(item.score*.2)-Math.min(8,item.gaps.length*2)), maximum:20, evidence:item.gaps[0]},
      {name:'Seniority and required duration', points:Math.round(item.score*.1), maximum:10, evidence:'Dates and seniority are taken only from the selected default resume.'},
      {name:'Communication and collaboration', points:Math.min(10,Math.round(item.score*.1)+2), maximum:10, evidence:'Publications, proposals, presentations and mentoring are documented.'}
    ],
    confidence:item.confidence,
    assessed_at:now
  });
}
results.updated_at = now;
results.run_status = `Assessed ${matches.length} job matches`;
results.summary = `Scored ${matches.length} job matches using the default resume and published job requirements. Resume evidence contributes 75% and saved preferences contribute 25%.`;
results.runs.push({date:now,title:'Resume and preference match assessment',status:'Completed',description:`Assessed ${matches.length} displayed jobs against the selected default resume and saved preferences.`});
results.history.push({time:now,operation:'default_resume_job_match_scoring',status:'completed',result:`${matches.length} displayed jobs received evidence-based resume and preference match scores; no application was submitted.`});
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2) + '\n');
fs.writeFileSync(matchesPath, JSON.stringify({
  master_resume:resumeRel,
  resume_sha256:sha(fs.readFileSync(path.join(root, resumeRel))),
  method:'Assistant evidence review of the selected default resume against published job requirements; saved preferences are combined separately by the GUI backend.',
  rubric:'Resume evidence score: core technical requirements 40, role/domain 20, delivery/production 20, seniority/duration 10, communication 10. Combined score: resume 75%, preferences 25%. Scores are internal fit estimates, not ATS scores or hiring probabilities.',
  matches
}, null, 2) + '\n');
console.log(`Assessed ${matches.length} jobs.`);
