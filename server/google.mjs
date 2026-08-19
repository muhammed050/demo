import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT=Number(process.env.API_PORT||8787);
const DATA_DIR=path.resolve(process.env.DELEGATION_DATA_DIR||'.delegation');
const FILE=path.join(DATA_DIR,'google.json');
const CLIENT_URL=process.env.CLIENT_URL||'http://localhost:3000';
const key=crypto.createHash('sha256').update(process.env.DELEGATION_ENCRYPTION_KEY||'change-me-in-production').digest();
const states=new Map();
await fs.mkdir(DATA_DIR,{recursive:true});
async function read(){try{return JSON.parse(await fs.readFile(FILE,'utf8'))}catch{return {}}}
async function write(v){await fs.writeFile(FILE,JSON.stringify(v,null,2),'utf8')}
function enc(v){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),d=Buffer.concat([c.update(v,'utf8'),c.final()]);return JSON.stringify({iv:iv.toString('base64'),tag:c.getAuthTag().toString('base64'),data:d.toString('base64')})}
function dec(v){const x=JSON.parse(v),d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(x.iv,'base64'));d.setAuthTag(Buffer.from(x.tag,'base64'));return Buffer.concat([d.update(Buffer.from(x.data,'base64')),d.final()]).toString('utf8')}
async function save(token){const s=await read();s.token=enc(JSON.stringify(token));await write(s)}
async function token(){const s=await read();if(!s.token)return null;const t=JSON.parse(dec(s.token));if(t.expires_at&&Date.now()<t.expires_at-60000)return t.access_token;if(!t.refresh_token)return t.access_token;const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:t.refresh_token,grant_type:'refresh_token'})});const n=await r.json();if(!r.ok)return null;const next={...t,access_token:n.access_token,expires_at:Date.now()+Number(n.expires_in||3600)*1000};await save(next);return next.access_token}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':CLIENT_URL,'Access-Control-Allow-Credentials':'true'});res.end(JSON.stringify(data))}
function redirect(res,url){res.writeHead(302,{Location:url});res.end()}
function env(res){const names=['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'];const missing=names.filter(x=>!process.env[x]);if(missing.length){send(res,400,{error:`Missing environment variables: ${missing.join(', ')}`});return false}return true}
async function body(req){let r='';for await(const c of req)r+=c;return r?JSON.parse(r):{}}
async function googleFetch(url,options={}){const t=await token();if(!t)throw new Error('Google is not connected');const r=await fetch(url,{...options,headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json',...(options.headers||{})}});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||d.error_description||`Google API ${r.status}`);return d}

export async function googleRoute(req,res,url){
  try {
    if(req.method==='GET'&&url.pathname==='/api/google/start'){
      if(!env(res))return;
      const state=crypto.randomBytes(24).toString('hex');states.set(state,Date.now()+600000);
      const redirectUri=process.env.GOOGLE_OAUTH_REDIRECT_URI||`http://localhost:${PORT}/api/google/callback`;
      const scope=['openid','email','profile','https://www.googleapis.com/auth/webmasters.readonly','https://www.googleapis.com/auth/analytics.readonly','https://www.googleapis.com/auth/spreadsheets'].join(' ');
      const q=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:redirectUri,response_type:'code',scope,access_type:'offline',prompt:'consent',state});
      return redirect(res,`https://accounts.google.com/o/oauth2/v2/auth?${q}`);
    }
    if(req.method==='GET'&&url.pathname==='/api/google/callback'){
      const state=url.searchParams.get('state');if(!states.has(state)||states.get(state)<Date.now()){states.delete(state);return send(res,400,{error:'Invalid or expired Google OAuth state'})}states.delete(state);
      if(url.searchParams.get('error'))return redirect(res,`${CLIENT_URL}/?integration=google&error=denied`);
      const redirectUri=process.env.GOOGLE_OAUTH_REDIRECT_URI||`http://localhost:${PORT}/api/google/callback`;
      const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:redirectUri,grant_type:'authorization_code'})});
      const t=await r.json();if(!r.ok)return send(res,400,{error:t.error_description||'Google OAuth failed'});await save({...t,expires_at:Date.now()+Number(t.expires_in||3600)*1000});return redirect(res,`${CLIENT_URL}/?integration=google&connected=1`);
    }
    if(req.method==='GET'&&url.pathname==='/api/google/status')return send(res,200,{connected:!!(await token())});
    if(req.method==='POST'&&url.pathname==='/api/google/disconnect'){await fs.rm(FILE,{force:true});return send(res,200,{ok:true})}
    if(req.method==='POST'&&url.pathname==='/api/google/search-console'){
      const {siteUrl,startDate,endDate,query}=await body(req);const payload={startDate,endDate,dimensions:query?['query','page']:['query'],rowLimit:250};if(query)payload.dimensionFilterGroups=[{filters:[{dimension:'query',operator:'contains',expression:query}]}];const d=await googleFetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{method:'POST',body:JSON.stringify(payload)});return send(res,200,d);
    }
    if(req.method==='POST'&&url.pathname==='/api/google/analytics'){
      const {propertyId,startDate,endDate}=await body(req);const d=await googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,{method:'POST',body:JSON.stringify({dateRanges:[{startDate,endDate}],dimensions:[{name:'date'}],metrics:[{name:'activeUsers'},{name:'sessions'},{name:'screenPageViews'},{name:'conversions'}]})});return send(res,200,d);
    }
    if(req.method==='POST'&&url.pathname==='/api/google/pagespeed'){
      const {url:target,strategy='mobile'}=await body(req);if(!/^https?:\/\//i.test(target||''))return send(res,400,{error:'Only http(s) URLs are allowed'});const keyParam=process.env.PAGESPEED_API_KEY?`&key=${encodeURIComponent(process.env.PAGESPEED_API_KEY)}`:'';const r=await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}${keyParam}`);const d=await r.json();if(!r.ok)return send(res,r.status,d);return send(res,200,{url:target,strategy,score:d.lighthouseResult?.categories?.performance?.score??null,accessibility:d.lighthouseResult?.categories?.accessibility?.score??null,bestPractices:d.lighthouseResult?.categories?.['best-practices']?.score??null,seo:d.lighthouseResult?.categories?.seo?.score??null,coreWebVitals:d.loadingExperience?.metrics||{},lighthouse:d.lighthouseResult});
    }
    if(req.method==='POST'&&url.pathname==='/api/google/trends'){
      const {geo='TR'}=await body(req);const r=await fetch(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`,{headers:{'User-Agent':'Mozilla/5.0 The-Delegation/1.0'}});const xml=await r.text();if(!r.ok)return send(res,r.status,{error:'Google Trends feed unavailable'});const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{const block=m[1];const title=block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.slice(1).find(Boolean)||'';const traffic=block.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1]||'';const pub=block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]||'';return{keyword:title,approxTraffic:traffic,publishedAt:pub}});return send(res,200,{geo,source:'Google Trends public trending RSS feed',keyword:(await body).keyword,items});
    }
    if(req.method==='POST'&&url.pathname==='/api/google/sheets/report'){
      const {spreadsheetId,title,values}=await body(req);const range=`${title}!A1`;const d=await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({majorDimension:'ROWS',values})});return send(res,200,d);
    }
    return false;
  } catch(error){return send(res,500,{error:error.message||'Google integration error'})}
}
