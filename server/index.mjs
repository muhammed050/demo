import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.API_PORT || 8787);
const DATA_DIR = path.resolve(process.env.DELEGATION_DATA_DIR || '.delegation');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');
const APPROVALS_FILE = path.join(DATA_DIR, 'approvals.json');
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const encKey = crypto.createHash('sha256').update(process.env.DELEGATION_ENCRYPTION_KEY || 'change-me-in-production').digest();
const oauthStates = new Map();

await fs.mkdir(DATA_DIR, { recursive: true });

async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; } }
async function writeJson(file, value) { await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8'); }
function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function decrypt(value) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.data, 'base64')), decipher.final()]).toString('utf8');
}
async function saveSecret(name, value) { const all = await readJson(SECRETS_FILE, {}); all[name] = encrypt(value); await writeJson(SECRETS_FILE, all); }
async function getSecret(name) { const all = await readJson(SECRETS_FILE, {}); return all[name] ? decrypt(all[name]) : null; }
async function removeSecret(name) { const all = await readJson(SECRETS_FILE, {}); delete all[name]; await writeJson(SECRETS_FILE, all); }

const permissionDefaults = {
  github: { read: true, write: true, branch: true, commit: true, pullRequest: true, merge: false },
  browser: { browse: true, interact: false },
  terminal: { enabled: true, allowedCommands: ['npm install', 'npm run build', 'npm run test', 'npm run lint'] },
  vercel: { read: true, previewDeploy: true, productionDeploy: false }
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': CLIENT_URL, 'Access-Control-Allow-Credentials': 'true' });
  res.end(JSON.stringify(body));
}
async function body(req) { let raw=''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
function redirect(res, location) { res.writeHead(302, { Location: location }); res.end(); }
function requireEnv(res, names) { const missing = names.filter(n => !process.env[n]); if (missing.length) { send(res, 400, { error: `Missing environment variables: ${missing.join(', ')}` }); return false; } return true; }
function approval(action, details) { return { id: crypto.randomUUID(), action, details, status: 'pending', createdAt: new Date().toISOString() }; }

async function route(req, res) {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': CLIENT_URL, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' }); return res.end(); }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/integrations') {
      const secrets = await readJson(SECRETS_FILE, {});
      return send(res, 200, { github: !!secrets.github, vercel: !!secrets.vercel, terminal: true, browser: true, permissions: permissionDefaults });
    }

    if (req.method === 'GET' && url.pathname === '/api/github/start') {
      if (!requireEnv(res, ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'])) return;
      const state = crypto.randomBytes(24).toString('hex'); oauthStates.set(state, { provider: 'github', expires: Date.now()+600000 });
      const callback = process.env.GITHUB_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/api/github/callback`;
      const q = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: callback, scope: 'repo', state });
      return redirect(res, `https://github.com/login/oauth/authorize?${q}`);
    }

    if (req.method === 'GET' && url.pathname === '/api/github/callback') {
      const state = url.searchParams.get('state'); const stored = oauthStates.get(state); oauthStates.delete(state);
      if (!stored || stored.expires < Date.now()) return send(res, 400, { error: 'Invalid or expired OAuth state' });
      if (url.searchParams.get('error')) return redirect(res, `${CLIENT_URL}/?integration=github&error=denied`);
      const code = url.searchParams.get('code');
      const callback = process.env.GITHUB_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/api/github/callback`;
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', { method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, body:JSON.stringify({ client_id:process.env.GITHUB_CLIENT_ID, client_secret:process.env.GITHUB_CLIENT_SECRET, code, redirect_uri:callback }) });
      const token = await tokenRes.json(); if (!token.access_token) return send(res, 400, { error: token.error_description || 'GitHub OAuth failed' });
      await saveSecret('github', token.access_token);
      return redirect(res, `${CLIENT_URL}/?integration=github&connected=1`);
    }

    if (req.method === 'GET' && url.pathname === '/api/vercel/start') {
      if (!requireEnv(res, ['VERCEL_CLIENT_ID', 'VERCEL_CLIENT_SECRET'])) return;
      const state = crypto.randomBytes(24).toString('hex'); oauthStates.set(state, { provider:'vercel', expires:Date.now()+600000 });
      const callback = process.env.VERCEL_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/api/vercel/callback`;
      const q = new URLSearchParams({ client_id: process.env.VERCEL_CLIENT_ID, redirect_uri: callback, state });
      return redirect(res, `https://vercel.com/oauth/authorize?${q}`);
    }

    if (req.method === 'GET' && url.pathname === '/api/vercel/callback') {
      const state = url.searchParams.get('state'); const stored = oauthStates.get(state); oauthStates.delete(state);
      if (!stored || stored.expires < Date.now()) return send(res, 400, { error:'Invalid or expired OAuth state' });
      const code = url.searchParams.get('code');
      const callback = process.env.VERCEL_OAUTH_REDIRECT_URI || `http://localhost:${PORT}/api/vercel/callback`;
      const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ client_id:process.env.VERCEL_CLIENT_ID, client_secret:process.env.VERCEL_CLIENT_SECRET, code, redirect_uri:callback }) });
      const token = await tokenRes.json(); if (!token.access_token) return send(res, 400, { error: token.error || 'Vercel OAuth failed' });
      await saveSecret('vercel', token.access_token);
      return redirect(res, `${CLIENT_URL}/?integration=vercel&connected=1`);
    }

    if (req.method === 'POST' && url.pathname === '/api/integrations/disconnect') {
      const { provider } = await body(req); if (!['github','vercel'].includes(provider)) return send(res,400,{error:'Unsupported provider'}); await removeSecret(provider); return send(res,200,{ok:true});
    }

    if (req.method === 'GET' && url.pathname === '/api/github/repos') {
      const token = await getSecret('github'); if (!token) return send(res,401,{error:'GitHub is not connected'});
      const r = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'} });
      return send(res,r.status,await r.json());
    }

    if (req.method === 'GET' && url.pathname === '/api/vercel/projects') {
      const token = await getSecret('vercel'); if (!token) return send(res,401,{error:'Vercel is not connected'});
      const r = await fetch('https://api.vercel.com/v9/projects?limit=100', { headers:{Authorization:`Bearer ${token}`} }); return send(res,r.status,await r.json());
    }

    if (req.method === 'POST' && url.pathname === '/api/browser/fetch') {
      const { url: target } = await body(req); if (!/^https?:\/\//i.test(target || '')) return send(res,400,{error:'Only http(s) URLs are allowed'});
      const r = await fetch(target, { redirect:'follow', headers:{'User-Agent':'The-Delegation-Agent-Browser/1.0'} }); const text = await r.text(); return send(res,200,{status:r.status,url:r.url,contentType:r.headers.get('content-type'),body:text.slice(0,200000)});
    }

    if (req.method === 'POST' && url.pathname === '/api/terminal/run') {
      const { command, cwd } = await body(req); const allowed = permissionDefaults.terminal.allowedCommands;
      if (!allowed.includes(command)) return send(res,403,{error:'Command is not allowed. Add it to the Tool Manager or request approval.'});
      const [bin,...args] = command.split(' '); const safeCwd = cwd ? path.resolve(cwd) : process.cwd();
      const result = await execFileAsync(bin,args,{cwd:safeCwd,timeout:120000,maxBuffer:1024*1024*4}); return send(res,200,{stdout:result.stdout,stderr:result.stderr,code:0});
    }

    if (req.method === 'GET' && url.pathname === '/api/approvals') return send(res,200,{approvals:await readJson(APPROVALS_FILE,[])});
    if (req.method === 'POST' && url.pathname === '/api/approvals') { const input=await body(req); const a=approval(input.action,input.details); const list=await readJson(APPROVALS_FILE,[]); list.push(a); await writeJson(APPROVALS_FILE,list); return send(res,201,a); }
    if (req.method === 'POST' && url.pathname.startsWith('/api/approvals/')) { const id=url.pathname.split('/').pop(); const input=await body(req); const list=await readJson(APPROVALS_FILE,[]); const item=list.find(x=>x.id===id); if(!item)return send(res,404,{error:'Approval not found'}); item.status=input.status==='approved'?'approved':'rejected'; item.updatedAt=new Date().toISOString(); await writeJson(APPROVALS_FILE,list); return send(res,200,item); }

    send(res,404,{error:'Not found'});
  } catch (error) { console.error(error); send(res,500,{error:error.message || 'Internal server error'}); }
}

http.createServer(route).listen(PORT, () => console.log(`The Delegation tools server listening on http://localhost:${PORT}`));
