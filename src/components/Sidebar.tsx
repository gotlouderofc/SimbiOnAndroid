/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Film, BarChart3, HelpCircle, Keyboard, Play, Compass, X } from 'lucide-react';
import { ScreenplayLine } from '../types';

interface SidebarProps {
  scenes: { line: ScreenplayLine; index: number }[];
  currentSceneIndex: number;
  onJumpToScene: (index: number) => void;
  wordCount: number;
  pagesCount: number;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  scenes,
  currentSceneIndex,
  onJumpToScene,
  wordCount,
  pagesCount,
  onCloseMobile,
}) => {
  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 text-neutral-300 flex flex-col h-full select-none overflow-hidden flex-shrink-0">
      {/* Scenes Nav Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between text-neutral-400 font-bold text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Scene Navigator</span>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-[#97cc5b] transition cursor-pointer"
              title="Close Navigator"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {scenes.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-neutral-600 italic">
              No scenes created yet.<br />
              Add a &quot;Scene Heading&quot; element to begin navigation.
            </div>
          ) : (
            <ul className="space-y-1">
              {scenes.map((scene, idx) => {
                const isActive = currentSceneIndex === scene.index;
                return (
                  <li key={scene.line.id}>
                    <button
                      onClick={() => onJumpToScene(scene.index)}
                      className={`w-full text-left px-3 py-2 text-xs font-mono rounded-md border-l-2 transition flex items-start gap-2 ${
                        isActive
                          ? 'bg-amber-600/10 border-amber-500 text-amber-450 font-bold'
                          : 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      <Film className="w-3 h-3 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">
                        {scene.line.text.trim() || 'UNTITLED SCENE'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Script Analytics Section */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/40">
        <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] uppercase tracking-wider mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
          <span>Live Script Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-neutral-900 border border-neutral-800/80 rounded-md p-2 text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight block">Pages</span>
            <span className="text-lg font-mono font-bold text-white mt-1 ">{pagesCount}</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800/80 rounded-md p-2 text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight block">Scenes</span>
            <span className="text-lg font-mono font-bold text-white mt-1">{scenes.length}</span>
          </div>
          <div className="col-span-2 bg-neutral-900 border border-neutral-800/80 rounded-md p-2 text-center">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight block">Words</span>
            <span className="text-base font-mono font-bold text-amber-400 mt-0.5">{wordCount}</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference panel */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 max-h-48 overflow-y-auto">
        <div className="flex items-center gap-2 text-neutral-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <Keyboard className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Hotkeys</span>
        </div>
        <div className="space-y-1.5 text-[10px] text-neutral-400">
          <div className="flex items-center justify-between">
            <span>Next Style</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono text-neutral-300">Tab</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Heading</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono text-neutral-300">Ctrl+1</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Action</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono text-neutral-300">Ctrl+2</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Character</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono text-neutral-300">Ctrl+3</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Dialogue</span>
            <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded font-mono text-neutral-300">Ctrl+5</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
};
