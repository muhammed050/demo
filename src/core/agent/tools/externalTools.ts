const API = 'http://localhost:8787';

export type ExternalPermission = 'github' | 'browser' | 'terminal' | 'vercel' | 'google';

export const EXTERNAL_TOOL_DEFINITIONS = [
  { name:'github_read_file', group:'github', description:'Read a text file from the connected GitHub repository.', properties:{ repository:{type:'string'}, path:{type:'string'}, ref:{type:'string'} }, required:['repository','path'] },
  { name:'github_search_code', group:'github', description:'Search source code in the connected GitHub repository.', properties:{ repository:{type:'string'}, query:{type:'string'} }, required:['repository','query'] },
  { name:'github_edit_file', group:'github', description:'Request a human-approved file edit in GitHub.', properties:{ repository:{type:'string'}, path:{type:'string'}, content:{type:'string'}, message:{type:'string'}, branch:{type:'string'} }, required:['repository','path','content','message'] },
  { name:'browser_fetch', group:'browser', description:'Fetch and inspect a public HTTP(S) website.', properties:{url:{type:'string'}}, required:['url'] },
  { name:'terminal_run', group:'terminal', description:'Run an allow-listed local npm command for build/test/lint.', properties:{command:{type:'string'},cwd:{type:'string'}}, required:['command'] },
  { name:'vercel_projects', group:'vercel', description:'List projects in the connected Vercel account.', properties:{}, required:[] },
  { name:'vercel_preview_deploy', group:'vercel', description:'Request a Vercel preview deployment. Human approval is required.', properties:{projectId:{type:'string'}}, required:['projectId'] },
  { name:'google_search_console', group:'google', description:'Read Google Search Console performance for a verified property.', properties:{siteUrl:{type:'string'},startDate:{type:'string'},endDate:{type:'string'},query:{type:'string'}}, required:['siteUrl','startDate','endDate'] },
  { name:'google_analytics', group:'google', description:'Read GA4 traffic metrics for a connected property.', properties:{propertyId:{type:'string'},startDate:{type:'string'},endDate:{type:'string'}}, required:['propertyId','startDate','endDate'] },
  { name:'google_pagespeed', group:'google', description:'Run a PageSpeed Insights audit for a public URL.', properties:{url:{type:'string'},strategy:{type:'string'}}, required:['url'] },
  { name:'google_trends', group:'google', description:'Research Google Trends interest and related queries using the public Trends feed.', properties:{keyword:{type:'string'},geo:{type:'string'},timeframe:{type:'string'}}, required:['keyword'] },
  { name:'google_sheets_report', group:'google', description:'Create or append a growth report to a connected Google Sheet.', properties:{spreadsheetId:{type:'string'},title:{type:'string'},values:{type:'array'}}, required:['spreadsheetId','title','values'] }
];

export function getExternalToolDefinitions(agentIndex:number):any[] {
  const permissions = JSON.parse(localStorage.getItem(`delegation-agent-permissions-${agentIndex}`) || '{}');
  return EXTERNAL_TOOL_DEFINITIONS.filter(t => permissions[t.group] !== false).map(t => ({ type:'function', function:{ name:t.name, description:t.description, parameters:{type:'object',properties:t.properties,required:t.required} } }));
}

export async function executeExternalTool(name:string,args:any):Promise<{ok:boolean;result:any}> {
  const post = async (url:string, body:any) => { const r=await fetch(`${API}${url}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); if(!r.ok) throw new Error(data.error||`Tool failed: ${name}`); return data; };
  try {
    let result:any;
    if(name==='github_read_file') result=await post('/api/github/read-file',args);
    else if(name==='github_search_code') result=await post('/api/github/search-code',args);
    else if(name==='github_edit_file') result=await post('/api/github/request-edit',args);
    else if(name==='browser_fetch') result=await post('/api/browser/fetch',args);
    else if(name==='terminal_run') result=await post('/api/terminal/run',args);
    else if(name==='vercel_projects') result=await (await fetch(`${API}/api/vercel/projects`)).json();
    else if(name==='vercel_preview_deploy') result=await post('/api/vercel/request-preview',args);
    else if(name==='google_search_console') result=await post('/api/google/search-console',args);
    else if(name==='google_analytics') result=await post('/api/google/analytics',args);
    else if(name==='google_pagespeed') result=await post('/api/google/pagespeed',args);
    else if(name==='google_trends') result=await post('/api/google/trends',args);
    else if(name==='google_sheets_report') result=await post('/api/google/sheets/report',args);
    else return {ok:false,result:{error:`Unknown external tool: ${name}`}};
    window.dispatchEvent(new CustomEvent('delegation-tool-result',{detail:{name,args,result}}));
    return {ok:true,result};
  } catch(error:any) {
    const result={error:error.message||String(error)};
    window.dispatchEvent(new CustomEvent('delegation-tool-result',{detail:{name,args,error:result.error}}));
    return {ok:false,result};
  }
}
