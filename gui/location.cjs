const normalizeLocation = value => String(value || '').toLowerCase().replace(/\bu\.s\.a?\.?\b/g, ' us ').replace(/[^a-z0-9]+/g, ' ').replace(/\bwashington d c\b/g,'washington dc').replace(/\bhampton roads\b/g,'hampton road').replace(/\s+/g,' ').trim();
const mentionsUS = value => /(^| )(us|usa|united states)( |$)/.test(normalizeLocation(value));
const isRemote = value => /(^| )remote( |$)/.test(normalizeLocation(value));
const mentionsForeignOrGlobalRegion = value => /(^| )(americas|worldwide|anywhere|global|international|europe|canada|mexico|latam|apac|asia|africa|australia|uk|united kingdom|israel)( |$)/.test(normalizeLocation(value));

function locationPreferenceMatches(job, preference) {
  const wanted = normalizeLocation(preference);
  const location = normalizeLocation(job.location);
  if (!wanted) return false;
  const wantsUS = mentionsUS(preference);
  const wantsRemote = isRemote(preference);
  const jobAllowsUS = mentionsUS(job.location);
  const jobIsUSOnly = jobAllowsUS && !mentionsForeignOrGlobalRegion(job.location);
  if (wantsRemote) return job.remote === true && (!wantsUS || jobIsUSOnly);
  const localTerms = wanted.replace(/(^| )(us|usa|united states)( |$)/g, ' ').replace(/\s+/g, ' ').trim();
  if (localTerms && location.includes(localTerms)) return !wantsUS || jobAllowsUS;
  return wantsUS && !localTerms && jobAllowsUS;
}

function matchingLocationPreferences(job, preferences) {
  return (preferences || []).filter(preference => locationPreferenceMatches(job, preference));
}

module.exports = { normalizeLocation, mentionsUS, mentionsForeignOrGlobalRegion, locationPreferenceMatches, matchingLocationPreferences };
