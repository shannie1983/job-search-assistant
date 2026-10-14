const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rank, searchLinks } = require('./search.cjs');
test('excludes unrelated roles without claiming experience validation', () => {
  const jobs = [{ title: 'ML scientist', description: 'machine learning', location: 'USA only', remote: true }, { title: 'Accountant', description: 'Tax', location: 'London', remote: false }];
  const matches = rank(jobs, { target_roles: ['machine learning'], keywords: [], preferred_locations: ['remote'], preference_modes: { target_roles: 'required' } });
  assert.equal(matches.length, 1);
  assert.match(matches[0].reason, /locked preferences are required/);
  assert.equal(matches[0].location, 'USA only');
});
test('escapes search terms and uses official USAJOBS domain', () => {
  const links = searchLinks({ target_roles: ['ML & AI'], preferred_locations: ['Washington, DC'], sources: ['usajobs.com', 'linkedin.com', 'indeed.com', 'unknown'] });
  assert.equal(links.length, 3);
  assert.equal(new URL(links[0].url).hostname, 'www.usajobs.gov');
  assert.equal(new URL(links[0].url).searchParams.get('k'), 'ML & AI');
});
test('requires one configured keyword and rejects only excessive stated years', () => {
  const jobs=[
    {title:'ML scientist',description:'Python research. Requires 5 years of experience.',location:'USA only',remote:true},
    {title:'ML scientist',description:'Java research. Requires 5 years of experience.',location:'USA only',remote:true},
    {title:'ML scientist',description:'Python research. Requires 15 years of experience.',location:'USA only',remote:true}
  ];
  const matches=rank(jobs,{target_roles:['ML'],keywords:['Python','remote sensing'],preferred_locations:['remote, US'],experience_years:13,preference_modes:{preferred_locations:'required'}});
  assert.equal(matches.length,1);
  assert.equal(matches[0].required_experience_years,5);
});
test('builds direct searches from keywords when target titles are blank', () => {
  const links=searchLinks({target_roles:[],keywords:['machine learning'],preferred_locations:['Virginia, US'],sources:['usajobs.com']});
  assert.equal(links.length,1);
  assert.equal(new URL(links[0].url).searchParams.get('k'),'machine learning');
});
test('merges keyword evidence when one USAJOBS posting is found by multiple searches',async()=>{const original=global.fetch;let calls=0;global.fetch=async(url,options)=>{if(String(url).includes('/job/123'))return {ok:true,status:200,url:String(url),headers:{get:()=> 'text/html'},text:async()=>'<h1>Research scientist</h1><button>Apply</button>'};if(!options?.method)return {ok:true,headers:{getSetCookie:()=>[]}};calls++;return {ok:true,json:async()=>({Jobs:[{DocumentID:'123',Agency:'NASA',Title:'Research scientist',LocationDisplay:'Hampton, VA',PositionURI:'https://www.usajobs.gov/job/123'}]})}};try{const {discover}=require('./search.cjs');const result=await discover('usajobs',{target_roles:[],keywords:['machine learning','remote sensing'],preferred_locations:[],sources:[],preference_modes:{},experience_years:13},process.cwd());assert.equal(calls,2);assert.equal(result.jobs.length,1);assert.deepEqual(result.jobs[0].matched_keywords.sort(),['machine learning','remote sensing']);assert.equal(result.jobs[0].availability.state,'available')}finally{global.fetch=original}});
