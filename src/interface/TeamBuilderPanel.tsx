import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, Plus, Sparkles, Users, X } from 'lucide-react';
import { useTeamStore } from '../integration/store/teamStore';
import { ELDEVO_TEAM } from '../data/eldevoTeam';
import { DEFAULT_MODELS } from '../core/llm/constants';
import type { AgentNode, AgenticSystem } from '../data/agents';

const ROLES = [
  ['Orchestrator', 'Plans work, delegates tasks and reviews results.', '#2563EB'],
  ['Researcher', 'Researches markets, competitors and requirements.', '#7C3AED'],
  ['SEO', 'Handles search strategy, technical SEO and content opportunities.', '#F59E0B'],
  ['Trends Researcher', 'Finds rising topics and search demand signals from Google Trends.', '#E11D48'],
  ['Analytics', 'Reads GA4 traffic and conversion trends and turns them into actions.', '#0F766E'],
  ['Performance', 'Runs PageSpeed and Core Web Vitals audits and prioritizes fixes.', '#EA580C'],
  ['Developer', 'Reads, edits and tests software with connected tools.', '#16A34A'],
  ['Designer', 'Improves UX, UI, accessibility and conversion flows.', '#EC4899'],
  ['Content', 'Creates useful content, copy and editorial plans.', '#EF4444'],
  ['Growth', 'Runs growth, analytics and monetization experiments.', '#0891B2'],
  ['Reporting', 'Combines research into executive reports and Google Sheets updates.', '#4F46E5'],
  ['QA', 'Tests features, websites and regressions.', '#475569'],
  ['Security', 'Reviews secrets, permissions and risky changes.', '#991B1B'],
  ['DevOps', 'Handles builds, previews and release workflows.', '#334155'],
];

function makeAgent(index:number, role:string, description:string, color:string):AgentNode {
  return { id:`custom-${role.toLowerCase().replace(/\s+/g,'-')}-${index}`, index, name:role, description, color, model:DEFAULT_MODELS.text, humanInTheLoop:['Developer','Security','DevOps','Orchestrator'].includes(role), position:{x:(index-1)*180,y:280} };
}

export const TeamBuilderPanel:React.FC<{onClose:()=>void}> = ({onClose}) => {
  const { saveCustomSystem, setActiveTeam } = useTeamStore();
  const [name,setName]=useState('My AI Agency');
  const [description,setDescription]=useState('A specialized autonomous AI team.');
  const [selected,setSelected]=useState<string[]>(['Researcher','SEO','Trends Researcher','Analytics','Performance','Developer','Reporting','QA']);
  const [created,setCreated]=useState(false);
  const toggle=(role:string)=>setSelected(s=>s.includes(role)?s.filter(x=>x!==role):[...s,role]);
  const agents=useMemo(()=>selected.map((role,i)=>{const r=ROLES.find(x=>x[0]===role)!;return makeAgent(i+2,r[0],r[1],r[2])}),[selected]);
  const create=()=>{
    const lead:AgentNode={id:`custom-orchestrator-${Date.now()}`,index:1,name:'Orchestrator / Lead',description:'Coordinates the team, delegates tasks, reviews tool results and asks for approval when required.',color:'#2563EB',model:DEFAULT_MODELS.text,humanInTheLoop:true,position:{x:0,y:130},subagents:agents};
    const system:AgenticSystem={id:`custom-team-${Date.now()}`,teamName:name.trim()||'My AI Agency',teamType:'Custom',teamDescription:description.trim(),color:'#2563EB',outputType:'text',outputModel:DEFAULT_MODELS.text,outputAutoApprove:false,user:{index:0,model:'Human',position:{x:0,y:0}},leadAgent:lead};
    saveCustomSystem(system);setActiveTeam(system.id);setCreated(true);setTimeout(onClose,500);
  };
  const useTemplate=()=>{saveCustomSystem(ELDEVO_TEAM);setActiveTeam(ELDEVO_TEAM.id);setCreated(true);setTimeout(onClose,500)};
  return <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-5xl max-h-[92vh] overflow-auto bg-white rounded-3xl shadow-2xl border border-zinc-200"><div className="p-6 border-b flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-blue-600">Team Builder</div><h1 className="text-2xl font-black mt-1">Create an AI Team in minutes</h1><p className="text-sm text-zinc-500 mt-1">Choose roles, save the team, then assign tools from Integrations.</p></div><button onClick={onClose} className="p-2 rounded-xl border"><X size={18}/></button></div><div className="p-6 grid lg:grid-cols-[1fr_1.2fr] gap-6"><div className="space-y-4"><div className="p-5 rounded-2xl bg-blue-50 border border-blue-100"><div className="flex gap-3"><Sparkles className="text-blue-600"/><div><b className="text-sm">Eldevo template</b><p className="text-xs text-zinc-600 mt-1">Growth + engineering team with SEO, Trends, Analytics, Performance, reporting, development, QA, security and DevOps.</p><button onClick={useTemplate} className="mt-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold flex gap-2 items-center"><Copy size={13}/> Use Eldevo Team</button></div></div></div><label className="block"><span className="text-xs font-bold">Team name</span><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"/></label><label className="block"><span className="text-xs font-bold">Description</span><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"/></label><button disabled={!selected.length||created} onClick={create} className="w-full py-3 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"><Plus size={16}/>{created?'Created ✓':'Create Team'}</button></div><div><div className="flex items-center justify-between mb-3"><div><b className="text-sm">Agent roles</b><p className="text-xs text-zinc-500">Select as many as your project needs.</p></div><span className="text-xs font-bold text-zinc-400">{selected.length} selected</span></div><div className="grid sm:grid-cols-2 gap-3">{ROLES.filter(r=>r[0]!=='Orchestrator').map(([role,desc,color])=>{const on=selected.includes(role);return <button key={role} onClick={()=>toggle(role)} className={`text-left p-4 rounded-2xl border transition ${on?'border-blue-300 bg-blue-50':'border-zinc-200 bg-zinc-50 hover:bg-white'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:color as string}}><Bot size={15} color="white"/></span><b className="text-xs">{role}</b></div>{on&&<Check size={15} className="text-blue-600"/>}</div><p className="text-[10px] text-zinc-500 mt-3">{desc}</p></button>})}</div><div className="mt-5 p-4 rounded-2xl border bg-zinc-50"><div className="flex items-center gap-2"><Users size={16}/><b className="text-xs">Current team</b></div><div className="flex flex-wrap gap-2 mt-3"><span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold">Orchestrator</span>{agents.map(a=><span key={a.id} className="px-2 py-1 rounded-lg bg-white border text-[10px] font-bold">{a.name}</span>)}</div></div></div></div></div></div>;
};
