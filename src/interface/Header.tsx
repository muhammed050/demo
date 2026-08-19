import { Info, KeyRound, Maximize2, Settings, PlugZap, BarChart3 } from 'lucide-react';
import React, { useState } from 'react';
import packageJson from '../../package.json';
import { useCoreStore } from '../integration/store/coreStore';
import { useUiStore } from '../integration/store/uiStore';
import BYOKModal from './BYOKModal';
import InfoModal from './InfoModal';
import { GoogleIntegrationPanel } from './GoogleIntegrationPanel';

const version = packageJson.version;

const Header: React.FC<{onOpenIntegrations?:()=>void}> = ({onOpenIntegrations}) => {
  const { llmConfig, isBYOKOpen, setBYOKOpen } = useUiStore();
  const { setViewMode } = useCoreStore();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isGoogleOpen, setIsGoogleOpen] = useState(false);
  const hasKey = !!llmConfig.apiKey;

  const handleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  return (
    <header className="h-14 border-b border-zinc-100 flex items-center justify-between px-6 bg-white shrink-0 relative z-40">
      <div className="flex items-center min-w-0">
        <img src="images/the-delegation.svg" alt="The Delegation" className="h-10 w-auto shrink-0" />
        <div className="flex items-center gap-3 self-start mt-3 ml-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0"><button onClick={() => setIsInfoOpen(true)} className="text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"><Info size={14} strokeWidth={2}/></button><span className="text-[10px] font-medium text-zinc-400 font-mono">v{version}</span></div>
          <div className="flex items-center gap-3 min-w-0"><a href="https://x.com/arturitu" target="_blank" rel="noopener" className="text-[10px] font-medium text-zinc-400 hover:text-darkDelegation transition-colors truncate">@arturitu</a><a href="https://github.com/arturitu/the-delegation" target="_blank" rel="noopener" className="text-zinc-300 hover:text-darkDelegation transition-colors shrink-0" title="View on GitHub"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 2.29 6.53 3.18 1.06 5.47.03 5.47-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-.2-1.78-.89-3.64-3.95-3.64-.87 0-1.59.31-2.15.82-.2-.08-1.02-.36-2.12.08 0 0-.21.67.82 2.2-.82 1.04-.82 1.53-.82 2.2 0 2.2 1.1.44 1.92.16 2.12.08.56.51 1.27.82 2.15.82 3.07 0 3.75-1.87 3.95-3.65.25.29.73.54 1.48.54 1.07 0 1.93-.01 2.2-.01.21 0 .46.15.38.55A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={()=>setIsGoogleOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-600/10 active:scale-95 cursor-pointer h-9" title="Google Growth"><BarChart3 size={14}/><span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">Google Growth</span></button>
        <button onClick={onOpenIntegrations} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg transition-all shadow-lg shadow-black/10 active:scale-95 cursor-pointer h-9" title="Integrations & Tools"><PlugZap size={14}/><span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">Integrations</span></button>
        <button onClick={() => setViewMode('design')} className="flex items-center gap-2 px-3 py-1 bg-darkDelegation hover:bg-darkDelegation text-white rounded-lg transition-all shadow-lg shadow-black/10 active:scale-95 cursor-pointer h-9" title="Manage Teams"><Settings size={14}/><span className="text-[10px] font-black uppercase tracking-wider ml-1 hidden sm:inline">Manage Teams</span></button>
        <div className="w-px h-4 bg-zinc-200" />
        <div className="flex items-center gap-2"><button onClick={handleFullscreen} className="text-zinc-400 hover:text-darkDelegation transition-colors p-1" title="Fullscreen Browser"><Maximize2 size={16}/></button><button onClick={() => setBYOKOpen(true)} className="relative text-zinc-400 hover:text-darkDelegation transition-colors p-1" title="API Key (BYOK)"><KeyRound size={16} className={hasKey ? 'text-emerald-500 hover:text-emerald-600' : ''}/>{hasKey && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"/>}</button></div>
      </div>
      {isInfoOpen && <InfoModal key="info-modal" onClose={() => setIsInfoOpen(false)}/>} {isBYOKOpen && <BYOKModal key="byok-modal" onClose={() => setBYOKOpen(false)}/>} {isGoogleOpen && <GoogleIntegrationPanel onClose={()=>setIsGoogleOpen(false)}/>} 
    </header>
  );
};
export default Header;
