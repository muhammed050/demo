import { LLMMessage } from '../llm/types';
import { GeminiProvider } from '../llm/providers/GeminiProvider';
import { useUiStore } from '../../integration/store/uiStore';
import { useCoreStore } from '../../integration/store/coreStore';
import { useTeamStore } from '../../integration/store/teamStore';
import { ToolRegistry } from './ToolRegistry';
import { PromptBuilder } from './PromptBuilder';
import { AGENTIC_SETS, AgentNode } from '../../data/agents';

export interface BrainHost { data:AgentNode; simulation:{getAllAgents:()=>any[];processScheduledTasks:()=>void}; getCurrentTaskId:()=>string|null; }
export interface ThinkOptions { isChat?:boolean; tools?:any[]; silent?:boolean; toolRound?:number; }
export class AgentBrain {
  private history:LLMMessage[]=[]; public isThinking=false;
  constructor(private readonly host:BrainHost){this.refreshFromStore();}
  public async think(prompt:string,options:ThinkOptions={}):Promise<{text:string,toolCalls:any[]}> {
    if(this.isThinking)return{text:'',toolCalls:[]}; this.isThinking=true;
    try { const core=useCoreStore.getState();this.refreshFromStore();const cfg=useUiStore.getState().llmConfig;if(!cfg.apiKey)throw new Error('Gemini API key is required');const provider=new GeminiProvider(cfg.apiKey);const model=this.host.data.model||cfg.model;const teamId=useTeamStore.getState().selectedAgentSetId;const activeTeam=useTeamStore.getState().customSystems.find(s=>s.id===teamId)||AGENTIC_SETS.find(s=>s.id===teamId);const vision=activeTeam?.outputType==='image'||activeTeam?.outputType==='video';
      if(!options.isChat){const m:LLMMessage={role:'user',content:prompt,metadata:options.silent?{internal:true}:undefined};if(vision&&core.referenceImages.length)m.images=core.referenceImages;this.history.push(m);this.syncToStore()}
      const messages=this.history.slice(-20);const allAgents=this.host.simulation.getAllAgents();const systemPrompt=PromptBuilder.buildSystemPrompt(this.host.data,core.phase,core.userBrief,allAgents);const toolDefs=options.tools||ToolRegistry.getDefinitions(this.host.data.index,core.phase,this.host.data.subagents?.length||0);core.addRequestLog({agentIndex:this.host.data.index,agentName:this.host.data.name,systemInstruction:systemPrompt,contents:messages,systemTools:toolDefs,taskId:this.host.getCurrentTaskId()||undefined});const response=await provider.generateCompletion(messages,toolDefs,systemPrompt,model);core.addResponseLog({agentIndex:this.host.data.index,agentName:this.host.data.name,content:response.content||'',tool_calls:response.tool_calls,usage:response.usage,raw:response.raw,taskId:this.host.getCurrentTaskId()||undefined});const text=response.content||'';const calls=response.tool_calls?.map(tc=>{try{return{name:tc.function.name,args:JSON.parse(tc.function.arguments)}}catch{return null}}).filter(Boolean) as any[]||[];const finalContent=text||(calls.length?(options.silent?'Working...':'Working on it...'):'...');this.history.push({role:'assistant',content:finalContent,tool_calls:response.tool_calls,metadata:options.silent?{internal:true}:undefined});this.syncToStore();
      let pendingApproval=false;let externalCount=0;const results:any[]=[];
      for(const tc of calls){const outcome=await ToolRegistry.process(this.host as any,tc);results.push(outcome);if(outcome.external){externalCount++;const toolMessage:LLMMessage={role:'tool',name:tc.name,content:JSON.stringify(outcome.result??{})};this.history.push(toolMessage);this.syncToStore();if(outcome.result?.status==='pending'||outcome.result?.approvalId)pendingApproval=true;}if(tc.name==='deliver_project'&&outcome.handled)await this.handleFinalAssetGeneration(tc.args.output)}
      const round=options.toolRound||0;
      if(externalCount>0&&!pendingApproval&&round<3){this.isThinking=false;const next=await this.think('Continue the task using the tool results above. Do not repeat successful calls. If more information or another safe tool action is needed, perform it; otherwise provide the next concrete result.',{isChat:true,silent:options.silent,toolRound:round+1});this.isThinking=true;return{text:[text,next.text].filter(Boolean).join('\n\n'),toolCalls:[...calls,...next.toolCalls]};}
      return{text,toolCalls:calls};
    }catch(error){const msg=error instanceof Error?error.message:String(error);console.error(`[AgentBrain:${this.host.data.name}]`,error);useUiStore.getState().setBYOKOpen(true,msg);throw error}finally{this.isThinking=false;this.host.simulation.processScheduledTasks()}
  }
  public async spark(){return this.think('Start the project by proposing initial tasks.',{silent:true})}
  public async executeTask(taskId:string){return this.think(`Proceed with task: ${taskId}`,{silent:true})}
  public async concludeProject(){return this.think('All tasks are complete! Use the deliver_project tool to fulfill the final delivery with the project result.',{silent:true})}
  private getActiveTeam(){const id=useTeamStore.getState().selectedAgentSetId;return useTeamStore.getState().customSystems.find(s=>s.id===id)||AGENTIC_SETS.find(s=>s.id===id)}
  private async handleFinalAssetGeneration(prompt:string){const t=this.getActiveTeam();if(!t)return;const c=useCoreStore.getState();if(t.outputAutoApprove===false){c.setPendingOutputPrompt(prompt);c.setPendingOutputParams({model:t.outputModel});c.setReviewingOutput(true);return}await this.processFinalAsset(prompt,{model:t.outputModel})}
  public async processFinalAsset(prompt:string,options:any){const c=useCoreStore.getState(),t=this.getActiveTeam();if(!t)return;c.setIsGeneratingAsset(true);try{const cfg=useUiStore.getState().llmConfig;if(!cfg.apiKey)throw new Error('Gemini API key is required');const p=new GeminiProvider(cfg.apiKey) as any,model=options.model||t.outputModel||cfg.model;let data='',usage:any;if(t.outputType==='image'){const r=await p.generateImage(prompt,model,undefined,options,c.referenceImages);data=r.data;usage=r.usage}else if(t.outputType==='music'){const r=await p.generateAudio(prompt,model);data=r.data;usage=r.usage}else if(t.outputType==='video'){const r=await p.generateVideo(prompt,model,undefined,options,c.referenceImages);data=r.videoUrl;usage=r.usage}else{c.setFinalOutput(prompt);c.setPhase('done');c.setFinalOutputOpen(true);c.setIsGeneratingAsset(false);return}c.addResponseLog({agentIndex:-1,agentName:'System',content:`Final ${t.outputType} generated successfully.`,usage,raw:{model,...usage},taskId:undefined});c.setFinalOutput(prompt);c.setFinalAsset(t.outputType==='music'?'audio':t.outputType as any,data);c.setPhase('done');c.setFinalOutputOpen(true)}catch(e){c.setIsGeneratingAsset(false);const msg=e instanceof Error?e.message:String(e);useUiStore.getState().setBYOKOpen(true,msg)}finally{c.setIsGeneratingAsset(false)}}
  public appendHistory(message:LLMMessage){this.refreshFromStore();this.history.push(message);this.syncToStore()}
  private refreshFromStore(){const h=useCoreStore.getState().agentHistories[this.host.data.index];if(h)this.history=[...h]}
  private syncToStore(){useCoreStore.getState().setAgentHistory(this.host.data.index,this.history)}
}
