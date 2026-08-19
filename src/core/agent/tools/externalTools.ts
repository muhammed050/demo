const API = 'http://localhost:8787';

export type ExternalPermission = 'github' | 'browser' | 'terminal' | 'vercel';

export const EXTERNAL_TOOL_DEFINITIONS = [
  { name:'github_read_file', group:'github', description:'Read a text file from the connected GitHub repository.', properties:{ repository:{type:'string'}, path:{type:'string'}, ref:{type:'string'} }, required:['repository','path'] },
  { name:'github_search_code', group:'github', description:'Search source code in the connected GitHub repository.', properties:{ repository:{type:'string'}, query:{type:'string'} }, required:['repository','query'] },
  { name:'github_edit_file', group:'github', description:'Request a human-approved file edit in GitHub.', properties:{ repository:{type:'string'}, path:{type:'string'}, content:{type:'string'}, message:{type:'string'}, branch:{type:'string'} }, required:['repository','path','content','message'] },
  { name:'browser_fetch', group:'browser', description:'Fetch and inspect a public HTTP(S) website.', properties:{url:{type:'string'}}, required:['url'] },
  { name:'terminal_run', group:'terminal', description:'Run an allow-listed local npm command for build/test/lint.', properties:{command:{type:'string'},cwd:{type:'string'}}, required:['command'] },
  { name:'vercel_projects', group:'vercel', description:'List projects in the connected Vercel account.', properties:{}, required:[] },
  { name:'vercel_preview_deploy', group:'vercel', description:'Request a Vercel preview deployment. Human approval is required.', properties:{projectId:{type:'string'}}, required:['projectId'] }
];

export function getExternalToolDefinitions(agentIndex:number):any[] {
  const permissions = JSON.parse(localStorage.getItem(`delegation-agent-permissions-${agentIndex}`) || '{}');
  return EXTERNAL_TOOL_DEFINITIONS.filter(t => permissions[t.group] !== false).map(t => ({ type:'function', function:{ name:t.name, description:t.description, parameters:{type:'object',properties:t.properties,required:t.required} } }));
}

export async function executeExternalTool(name:string,args:any):Promise<{ok:boolean;result:any}> {
  const post = async (url:string, body:any) => { const r=await fetch(`${API}${url}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json(); if(!r.ok) throw new Error(data.error||`Tool failed: ${name}`); return data; };
  const get = async (url:string) => { const r=await fetch(`${API}${url}`); const data=await r.json(); if(!r.ok) throw new Error(data.error||`Tool failed: ${name}`); return data; };
  try {
    let result:any;
    if(name==='github_read_file') result=await post('/api/github/read-file',args);
    else if(name==='github_search_code') result=await post('/api/github/search-code',args);
    else if(name==='github_edit_file') result=await post('/api/github/request-edit',args);
    else if(name==='browser_fetch') result=await post('/api/browser/fetch',args);
    else if(name==='terminal_run') result=await post('/api/terminal/run',args);
    else if(name==='vercel_projects') result=await get('/api/vercel/projects');
    else if(name==='vercel_preview_deploy') result=await post('/api/vercel/request-preview',args);
    else return {ok:false,result:{error:`Unknown external tool: ${name}`}};
    window.dispatchEvent(new CustomEvent('delegation-tool-result',{detail:{name,args,result}}));
    return {ok:true,result};
  } catch(error:any) {
    const result={error:error.message||String(error)};
    window.dispatchEvent(new CustomEvent('delegation-tool-result',{detail:{name,args,error:result.error}}));
    return {ok:false,result};
  }
}
