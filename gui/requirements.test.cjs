const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requiredExperienceYears, experienceRequirementPasses } = require('./requirements.cjs');

test('extracts the largest stated experience requirement', () => {
  const job={description:'Requires 3+ years of Python and at least 8 years of professional experience.'};
  assert.equal(requiredExperienceYears(job),8);
  assert.equal(experienceRequirementPasses(job,13).passes,true);
  assert.equal(experienceRequirementPasses(job,7).passes,false);
});

test('does not reject a job when years are unstated', () => {
  assert.deepEqual(experienceRequirementPasses({description:'Experience preferred.'},13),{required:null,available:13,passes:true});
});
