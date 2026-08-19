/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCoreStore } from './integration/store/coreStore';
import { ActionLogPanel } from './interface/ActionLogPanel';
import { FinalOutputModal } from './interface/FinalOutputModal';
import Header from './interface/Header';
import InspectorPanel from './interface/InspectorPanel';
import { KanbanPanel } from './interface/KanbanPanel';
import { OutputReviewModal } from './interface/OutputReviewModal';
import SimulationView from './interface/SimulationView';
import { VisualConfigurator } from './interface/VisualConfigurator/VisualConfigurator';
import { IntegrationsPanel } from './interface/IntegrationsPanel';
import { SceneContext } from './simulation/SceneContext';
import { SceneManager } from './simulation/SceneManager';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<SceneManager | null>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const { isLogOpen, isKanbanOpen, setIsResizing, viewMode } = useCoreStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [kanbanHeight, setKanbanHeight] = useState(220);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), [setIsResizing]);
  const stopResizing = useCallback(() => setIsResizing(false), [setIsResizing]);
  const resize = useCallback((e: MouseEvent) => {
    if (useCoreStore.getState().isResizing) {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      if (newHeight >= windowHeight * 0.2 && newHeight <= windowHeight * 0.5) setKanbanHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [resize, stopResizing]);

  useEffect(() => {
    if (canvasRef.current && !managerRef.current) {
      const manager = new SceneManager(canvasRef.current);
      managerRef.current = manager;
      setSceneManager(manager);
    }
    return () => { if (managerRef.current) { managerRef.current.dispose(); managerRef.current = null; setSceneManager(null); } };
  }, []);

  return (
    <SceneContext.Provider value={sceneManager}>
      <div className="w-screen h-screen bg-white overflow-hidden flex flex-col">
        {!isFullscreen && <Header onOpenIntegrations={() => setIntegrationsOpen(true)} />}
        <div className="flex-1 flex flex-row min-h-0 min-w-0 overflow-hidden">
          {isLogOpen && !isFullscreen && viewMode !== 'design' && <ActionLogPanel />}
          <div className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-zinc-50">
            <div className="flex-1 flex flex-col min-w-0 min-h-0" style={{ visibility: viewMode === 'design' ? 'hidden' : 'visible' }}>
              <SimulationView canvasRef={canvasRef} isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
              {isKanbanOpen && !isFullscreen && <div className={`h-2 hover:h-2 bg-transparent hover:bg-zinc-200 border-t border-black/5 transition-colors cursor-row-resize z-30 flex items-center justify-center group shrink-0 ${useCoreStore.getState().isResizing ? 'bg-zinc-300' : ''}`} onMouseDown={startResizing}><div className="w-12 h-1 bg-zinc-300 rounded-full group-hover:bg-zinc-400" /></div>}
              {isKanbanOpen && !isFullscreen && <KanbanPanel height={kanbanHeight} />}
            </div>
          </div>
          {!isFullscreen && viewMode !== 'design' && <InspectorPanel />}
        </div>
        {viewMode === 'design' && <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6 bg-white/40 backdrop-blur-xl"><div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-zinc-200/50 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}><VisualConfigurator /></div></div>}
        <FinalOutputModal />
        <OutputReviewModal />
        {integrationsOpen && <IntegrationsPanel onClose={() => setIntegrationsOpen(false)} />}
      </div>
    </SceneContext.Provider>
  );
};

export default App;
