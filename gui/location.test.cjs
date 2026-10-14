const { test } = require('node:test');
const assert = require('node:assert/strict');
const { locationPreferenceMatches } = require('./location.cjs');

test('remote US requires explicit US eligibility', () => {
  assert.equal(locationPreferenceMatches({ remote:true, location:'Americas, Europe, Israel' }, 'remote, US'), false);
  assert.equal(locationPreferenceMatches({ remote:true, location:'Northern America, LATAM, Europe, APAC' }, 'remote, US'), false);
  assert.equal(locationPreferenceMatches({ remote:true, location:'United States' }, 'remote, US'), true);
  assert.equal(locationPreferenceMatches({ remote:true, location:'Europe, USA, Canada' }, 'remote, US'), false);
  assert.equal(locationPreferenceMatches({ remote:true, location:'USA only' }, 'remote, US'), true);
});

test('plain remote remains globally permissive', () => {
  assert.equal(locationPreferenceMatches({ remote:true, location:'Anywhere' }, 'remote'), true);
});

test('common US metro punctuation and plural variants match',()=>{
  assert.equal(locationPreferenceMatches({remote:false,location:'Washington, DC, US'},'washington D.C, US'),true);
  assert.equal(locationPreferenceMatches({remote:false,location:'Hampton Roads, VA, US'},'hampton road, VA, US'),true);
});
