"""Prepare a separate, evidence-linked NASA CV review using the saved user draft."""
import json, uuid, hashlib
from pathlib import Path
from datetime import datetime, timezone
from cv_document import main

root = Path(__file__).resolve().parent.parent
source = root / 'outputs/tailored/16012e98-4bf3-4a9c-8d99-f12b1af9c510/draft.json'
draft = json.loads(source.read_text(encoding='utf-8-sig'))
master = root / draft['master_resume']
document = main({'operation':'read', 'master':str(master)})
assert document['sha256'] == draft['master_sha256'], 'Selected master changed; recheck evidence first'
paragraphs = document['paragraphs']
replacements = {
3: ('Interdisciplinary researcher with 13+ years of experience leading computational algorithm development, observational and simulation data analysis, and multidisciplinary research. Designs, tests, and validates algorithms for measurement systems, radiative transfer, and machine learning applications, with 9+ years developing and testing computational algorithms and machine learning on NASA HPC platforms. Leads research teams and provides technical guidance on scientific and engineering investigations. NASA research co-investigator, proposal review panelist, and author of peer-reviewed publications on algorithm validation and testing.', [3,16,25,26,28], 'Clarify engineering analysis, validation, and technical leadership using documented research experience.'),
5: ('Measurement Systems: Sensor observation analysis for lidar, radar, radiometer, polarimeter, and hyperspectral instruments; algorithm design and improvement; signal processing and denoising; performance testing and validation of data retrieval methods.', [5], 'Make sensor and retrieval experience easier to scan without adding instrumentation qualifications.'),
6: ('Advanced Modeling, AI & Quantum Computing: Developed computational pipelines using Monte Carlo, lattice Boltzmann, and Fourier-transform methods; CNNs, LSTMs, Transformers, autoencoders, diffusion models, PINNs, ensemble learning, foundation model pretraining and fine-tuning, and quantum ML. Led algorithm design, implementation, validation, experimental testing, performance benchmarking, and hybrid model integration to improve predictive accuracy, scalability, and computational efficiency.', [6], 'Emphasize documented algorithm design and testing; remove informal phrasing.'),
7: ('Scientific Computing: Developed and optimized large-scale scientific computing and data analysis workflows on NASA HPC platforms using Python, PyTorch, MATLAB, and Fortran, GPU/QPU acceleration, and Slurm-managed workflows. Improved computational scalability, model performance, and efficiency.', [7], 'Lead with engineering work and retain the original tools and platforms.'),
9: ('Research Leadership: Led proposal development and multidisciplinary research teams; served as a NASA proposal reviewer and panelist; supervised interns; and collaborated with government agencies, academia, and industry.', [9,20,22,28], 'Separate research leadership, technical review, and mentorship into clear activities.'),
13: ('Provided STEM expertise for large language model evaluation, reasoning, data collection, and quality control.', [13,11], 'Correct capitalization and use past tense for the completed appointment.'),
14: ('Research Engineer / Science Investigator | Jun 2023 – May 2026', [14], 'Restore missing spacing between the title and dates; preserve the source dates for review.'),
16: ('Science Investigator, 2025 LaRC IRAD: Led engineering research and algorithm development for an AI foundation model integrating passive and active radiative transfer simulation. Extended the computational architecture to hyperspectral and lidar sensor data to advance measurement system modeling, physics-based simulation, and retrieval algorithms.', [16], 'State the project, technical contribution, and supported engineering purpose clearly.'),
17: ('Developed an AI roadmap and proposal for the Navigation Doppler Lidar (NDL) precision landing system using autoencoders and diffusion models for signal denoising and outlier detection, outperforming classical Kalman filtering and Fourier-transform methods. Investigated retrieval algorithms for range, velocity, surface slope, and albedo estimation to improve precision landing and autonomous navigation.', [17], 'Tighten the documented navigation and signal-processing work without adding new performance figures.'),
18: ('Science Investigator, 2024 Langley Innovation and Transformation (LIT): Developed a machine learning surrogate model for scattering lidar and DIAL to enable fast simulation suitable for integration into NASA modeling frameworks. Published in Remote Sensing Letters (2026).', [18], 'Make the modeling contribution and publication reference explicit.'),
22: ('Mentored and supervised NASA SPARK interns on machine learning applications.', [22], 'Use concise wording for documented technical mentorship.'),
23: ('Scientific Researcher | 2015 – Jun 2023', [23], 'Restore missing spacing between the title and dates.'),
25: ('Developed and evaluated radiative transfer algorithms for lidar measurement systems using Monte Carlo simulation and Mie scattering methods to assess sensor performance and validate retrieval algorithms.', [25], 'Emphasize engineering analysis and validation while preserving the original technical scope.'),
27: ('Applied computer vision, machine learning, and analytical techniques to passive satellite observations and CALIPSO data processing and pattern recognition.', [27], 'Clarify the source wording without claiming additional operational deployment.'),
29: ('Communicated research findings and emerging science and technology through publications, technical products, presentations, briefings, scientific forums, and technical reviews.', [29], 'Use consistent past tense for the completed role.')
}
changes=[]
for index,(after,indices,reason) in replacements.items():
    changes.append({'index':index,'before':paragraphs[index]['text'],'after':after,'accepted':True,'rationale':reason,'sources':['Master CV paragraph '+str(i+1) for i in indices]})
now=datetime.now(timezone.utc).isoformat()
draft.update(id=str(uuid.uuid4()),draft_kind='user',created_at=now,updated_at=now,
    provider='assistant_python',paragraphs=paragraphs,changes=changes,
    note='Prepared in Codex and exported with Python. No OpenAI API request was made. Review each proposed edit before using the CV.',
    parent_draft_id=draft['id'])
draft['job']={**draft['job'],'title':'NASA Engineering — Codex Python CV review'}
draft['keywords']=['Python','PyTorch','machine learning','HPC','algorithm development','validation','design','modeling','technical guidance','technical reviews','mentorship','radiative transfer','lidar']
draft['gaps']=['Employment dates need confirmation: the Research Engineer role ends May 2026, while its employer line lists June 2023–October 2025. Both source statements were preserved.', 'The posting requires a resume of two pages or fewer. Rendered page count is not yet verified.', 'Federal resume hours per week are not present in the selected CV; add the actual values if required by the posting.']
draft.pop('last_export',None)
folder=root/'outputs/tailored'/draft['id']; folder.mkdir(parents=True)
revision=str(uuid.uuid4()); output=folder/revision
validation=main({'operation':'export','master':str(master),'master_sha256':draft['master_sha256'],'changes':changes,'keywords':draft['keywords'],'output':str(output)})
assert validation['tracked']['insertions']==len(changes)
assert validation['final']['insertions']==validation['final']['deletions']==0
assert hashlib.sha256(master.read_bytes()).hexdigest()==draft['master_sha256']
draft['last_export']={'revision':revision,'validation':validation,'files':['cv_tracked_highlighted.docx','cv_tracked.docx','cv_final.docx']}
(folder/'draft.json').write_text(json.dumps(draft,indent=2,ensure_ascii=False),encoding='utf-8')
report='# NASA engineering CV review\n\nSource: '+draft['master_resume']+'\n\nPrepared in Codex using Python; no OpenAI API request. Original CV preserved.\n\n'
report+='\n'.join('- P'+str(c['index']+1)+': '+c['rationale']+' Evidence: '+', '.join(c['sources']) for c in changes)
report+='\n\n## Items to verify\n\n'+'\n'.join('- '+gap for gap in draft['gaps'])+'\n'
(folder/'review.md').write_text(report,encoding='utf-8')
results_file=root/'outputs/results.json'; results=json.loads(results_file.read_text(encoding='utf-8-sig'))
results.setdefault('history',[]).append({'time':now,'operation':'assistant_python_cv_review','draft_id':draft['id'],'job_url':draft['job']['url'],'accepted_changes':len(changes),'status':'draft_prepared_layout_unverified'})
results_file.write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'id':draft['id'],'revision':revision,'output':str(output),'validation':validation}))
