import { LLMMessage } from '../llm/types';
import { GeminiProvider } from '../llm/providers/GeminiProvider';
import { useUiStore } from '../../integration/store/uiStore';
import { useCoreStore } from '../../integration/store/coreStore';
import { useTeamStore } from '../../integration/store/teamStore';
import { ToolRegistry } from './ToolRegistry';
import { PromptBuilder } from './PromptBuilder';
import { AGENTIC_SETS, AgentNode } from '../../data/agents';

export interface BrainHost { data:AgentNode; simulation:{getAllAgents:()=>any[];processScheduledTasks:()=>void}; getCurrentTaskId:()=>string|null; }
export interface ThinkOptions { isChat?:boolean; tools?:any[]; silent?:boolean; }

export class AgentBrain {
  private history:LLMMessage[]=[]; public isThinking=false;
  constructor(private readonly host:BrainHost){this.refreshFromStore();}
  public async think(prompt:string,options:ThinkOptions={}):Promise<{text:string,toolCalls:any[]}> {
    if(this.isThinking)return{text:'',toolCalls:[]}; this.isThinking=true;
    try {
      this.refreshFromStore(); const core=useCoreStore.getState(); const llmConfig=useUiStore.getState().llmConfig;
      if(!llmConfig.apiKey)throw new Error('Gemini API key is required');
      const provider=new GeminiProvider(llmConfig.apiKey); const model=this.host.data.model||llmConfig.model;
      const teamId=useTeamStore.getState().selectedAgentSetId; const activeTeam=useTeamStore.getState().customSystems.find(s=>s.id===teamId)||AGENTIC_SETS.find(s=>s.id===teamId);
      const hasVisionSupport=activeTeam?.outputType==='image'||activeTeam?.outputType==='video';
      if(!options.isChat){const userMsg:LLMMessage={role:'user',content:prompt,metadata:options.silent?{internal:true}:undefined}; if(hasVisionSupport&&core.referenceImages.length>0)userMsg.images=core.referenceImages; this.history.push(userMsg); this.syncToStore();}
      let messages=this.history.slice(-10); if(options.isChat&&hasVisionSupport&&core.referenceImages.length>0)messages=messages.map((m,idx)=>idx===messages.length-1&&m.role==='user'?{...m,images:core.referenceImages}:m);
      const allAgents=this.host.simulation.getAllAgents(); const systemPrompt=PromptBuilder.buildSystemPrompt(this.host.data,core.phase,core.userBrief,allAgents); const toolDefs=options.tools||ToolRegistry.getDefinitions(this.host.data.index,core.phase,this.host.data.subagents?.length||0);
      core.addRequestLog({agentIndex:this.host.data.index,agentName:this.host.data.name,systemInstruction:systemPrompt,contents:messages,systemTools:toolDefs,taskId:this.host.getCurrentTaskId()||undefined});
      const response=await provider.generateCompletion(messages,toolDefs,systemPrompt,model);
      core.addResponseLog({agentIndex:this.host.data.index,agentName:this.host.data.name,content:response.content||'',tool_calls:response.tool_calls,usage:response.usage,raw:response.raw,taskId:this.host.getCurrentTaskId()||undefined});
      const text=response.content||''; const toolCalls=response.tool_calls?.map(tc=>{try{return{name:tc.function.name,args:JSON.parse(tc.function.arguments)}}catch{return null}}).filter(Boolean) as any[]||[];
      const isInternalTrigger=options.silent; const hasToolCallsOnly=!text&&toolCalls.length>0; const isBrief=toolCalls.some(tc=>tc.name==='set_user_brief'); let finalContent=text;
      if(response.finishReason==='MALFORMED_FUNCTION_CALL')finalContent='ERROR: Malformed function call. Please try again.'; else if(hasToolCallsOnly&&!isInternalTrigger)finalContent=isBrief?'Project brief set. Let\'s begin!':'Working on it...'; else if(!text&&!toolCalls.length&&!isInternalTrigger)finalContent='...';
      if(options.isChat&&isBrief)setTimeout(()=>{if(useUiStore.getState().isChatting)useUiStore.getState().setChatting(false);useUiStore.getState().setSelectedNpc(null);},3000);
      this.history.push({role:'assistant',content:finalContent,tool_calls:response.tool_calls,metadata:isInternalTrigger?{internal:true}:undefined}); this.syncToStore();
      for(const tc of toolCalls){const handled=await ToolRegistry.process(this.host as any,tc); if(tc.name==='deliver_project'&&handled)this.handleFinalAssetGeneration(tc.args.output);}
      return{text,toolCalls};
    }catch(error){console.error(`[AgentBrain:${this.host.data.name}] Logic error:`,error); const errMsg=error instanceof Error?error.message:String(error); useUiStore.getState().setBYOKOpen(true,errMsg); throw error;}
    finally{this.isThinking=false;this.host.simulation.processScheduledTasks();}
  }
  public async spark(){return this.think('Start the project by proposing initial tasks.',{silent:true});}
  public async executeTask(taskId:string){return this.think(`Proceed with task: ${taskId}`,{silent:true});}
  public async concludeProject(){return this.think('All tasks are complete! Use the deliver_project tool to fulfill the final delivery with the project result.',{silent:true});}
  private async handleFinalAssetGeneration(prompt:string){const activeTeam=this.getActiveTeam();if(!activeTeam)return;const core=useCoreStore.getState();if(activeTeam.outputAutoApprove===false){core.setPendingOutputPrompt(prompt);const p:any={model:activeTeam.outputModel};if(activeTeam.outputType==='image'){p.aspectRatio='16:9';p.imageSize='1K'}else if(activeTeam.outputType==='video'){p.resolution='720p';p.aspectRatio='16:9';p.durationSeconds=4}core.setPendingOutputParams(p);core.setReviewingOutput(true);return;}await this.processFinalAsset(prompt,{model:activeTeam.outputModel});}
  public async processFinalAsset(prompt:string,options:any){const core=useCoreStore.getState();const activeTeam=this.getActiveTeam();if(!activeTeam)return;core.setIsGeneratingAsset(true);core.setReviewingOutput(false);try{const llmConfig=useUiStore.getState().llmConfig;if(!llmConfig.apiKey)throw new Error('Gemini API key is required');const provider=new GeminiProvider(llmConfig.apiKey) as any;const model=options.model||activeTeam.outputModel||llmConfig.model;core.addLogEntry({agentIndex:-1,action:`Generating final ${activeTeam.outputType} using ${model}...`,taskId:undefined});let assetContent='';let usage:any=undefined;if(activeTeam.outputType==='image'){const result=await provider.generateImage(prompt,model,(m:string)=>console.log(`[System:Image] ${m}`),options,core.referenceImages);assetContent=result.data||'';usage=result.usage;}else if(activeTeam.outputType==='music'){const result=await provider.generateAudio(prompt,(m:string)=>console.log(`[System:Audio] ${m}`),model);assetContent=result.data||'';usage=result.usage;}else if(activeTeam.outputType==='video'){const result=await provider.generateVideo(prompt,model,(m:string)=>console.log(`[System:Video] ${m}`),options,core.referenceImages);assetContent=result.videoUrl||'';usage=result.usage;}else{core.setFinalOutput(prompt);core.setPhase('done');core.setFinalOutputOpen(true);core.setIsGeneratingAsset(false);return;}core.addResponseLog({agentIndex:-1,agentName:'System',content:`Final ${activeTeam.outputType} generated successfully.`,usage,raw:{model,...usage},taskId:undefined});core.setFinalOutput(prompt);core.setFinalAsset(activeTeam.outputType==='music'?'audio':activeTeam.outputType as any,assetContent);core.setPhase('done');core.setFinalOutputOpen(true);}catch(error){console.error('[AgentBrain] Final asset generation failed:',error);core.setIsGeneratingAsset(false);const errMsg=error instanceof Error?error.message:String(error);useUiStore.getState().setBYOKOpen(true,errMsg);core.addLogEntry({agentIndex:0,action:`Error generating final ${activeTeam.outputType}: ${errMsg}`,taskId:undefined});}}
  private getActiveTeam(){const teamId=useTeamStore.getState().selectedAgentSetId;return useTeamStore.getState().customSystems.find(s=>s.id===teamId)||AGENTIC_SETS.find(s=>s.id===teamId);}
  public appendHistory(message:LLMMessage){this.refreshFromStore();this.history.push(message);this.syncToStore();}
  private refreshFromStore(){const history=useCoreStore.getState().agentHistories[this.host.data.index];if(history)this.history=[...history];}
  private syncToStore(){useCoreStore.getState().setAgentHistory(this.host.data.index,this.history);}
}
