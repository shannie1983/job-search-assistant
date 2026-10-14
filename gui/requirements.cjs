function requiredExperienceYears(job) {
  const text = `${job.title || ''} ${job.description || ''}`;
  const matches = [...text.matchAll(/(?:at least|minimum(?: of)?|minimum)?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional|commercial|relevant|work|industry|experience)/gi)];
  if (!matches.length) {
    const fallback = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi)];
    return fallback.length ? Math.max(...fallback.map(match => Number(match[1]))) : null;
  }
  return Math.max(...matches.map(match => Number(match[1])));
}

function experienceRequirementPasses(job, candidateYears) {
  const required = requiredExperienceYears(job);
  const available = Number(candidateYears);
  return { required, available:Number.isFinite(available) ? available : null, passes:required === null || !Number.isFinite(available) || required <= available };
}

module.exports = { requiredExperienceYears, experienceRequirementPasses };
