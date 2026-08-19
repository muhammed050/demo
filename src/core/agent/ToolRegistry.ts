import { LLMMessage } from '../llm/types';
import { setUserBrief } from './tools/setUserBrief';
import { proposeTask } from './tools/proposeTask';
import { completeTask } from './tools/completeTask';
import { deliverProject } from './tools/deliverProject';
import { EXTERNAL_TOOL_DEFINITIONS, executeExternalTool, getExternalToolDefinitions } from './tools/externalTools';

export interface ToolCall { name: string; args: any; }
export interface AgentActionContext { data: { index:number; name:string, subagents?:any[], humanInTheLoop?:boolean }; setState:(state:'idle'|'moving'|'working'|'on_hold'|'talking')=>void; appendHistory:(message:LLMMessage)=>void; }

export class ToolRegistry {
  public static async process(agent: AgentActionContext, toolCall: ToolCall): Promise<boolean> {
    const { name, args } = toolCall;
    switch (name) {
      case 'set_user_brief': return setUserBrief(agent,args);
      case 'propose_task': return proposeTask(agent,args);
      case 'complete_task': return completeTask(agent,args);
      case 'deliver_project': return deliverProject(agent,args);
      default:
        if (EXTERNAL_TOOL_DEFINITIONS.some(t=>t.name===name)) return executeExternalTool(name,args);
        console.warn(`[ToolRegistry] Unknown tool: ${name}`); return false;
    }
  }

  public static getDefinitions(agentIndex:number, phase:string, subagentsCount:number=0):any[] {
    const isLead=agentIndex===1; const isManager=subagentsCount>0; const tools:any[]=[];
    if (phase==='idle') {
      if (isLead) tools.push({type:'function',function:{name:'set_user_brief',description:'Start project with brief.',parameters:{type:'object',properties:{brief:{type:'string'}},required:['brief']}}});
      return [...tools,...getExternalToolDefinitions(agentIndex)];
    }
    if (phase==='working') {
      if (isLead||isManager) tools.push({type:'function',function:{name:'propose_task',description:'Assign task to agent.',parameters:{type:'object',properties:{title:{type:'string'},description:{type:'string'},agentId:{type:'integer',description:'Agent index'},requiresApproval:{type:'boolean'}},required:['title','description','agentId']}}});
      tools.push({type:'function',function:{name:'complete_task',description:'Finish task. Output must be raw content.',parameters:{type:'object',properties:{taskId:{type:'string'},output:{type:'string'}},required:['taskId','output']}}});
      if (isLead) tools.push({type:'function',function:{name:'deliver_project',description:'Final delivery of the full project results.',parameters:{type:'object',properties:{output:{type:'string'}},required:['output']}}});
    }
    return [...tools,...getExternalToolDefinitions(agentIndex)];
  }
}
