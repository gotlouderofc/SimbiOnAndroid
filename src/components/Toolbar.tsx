/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Undo,
  Redo,
  Save,
  Download,
  LogOut,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Loader2,
  AlertCircle,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Pen
} from 'lucide-react';

interface ToolbarProps {
  title: string;
  writer: string;
  saveStatus: 'saved' | 'saving' | 'error';
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel: number;
  currentLineAlign?: 'left' | 'center' | 'right';
  isRightSidebarOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSaveNow: () => void;
  onExportPDF: () => void;
  onGoBack: () => void;
  onApplyBold: () => void;
  onApplyItalic: () => void;
  onResetNormal: () => void;
  onChangeAlignment: (align?: 'left' | 'center' | 'right') => void;
  onToggleRightSidebar: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  title,
  writer,
  saveStatus,
  canUndo,
  canRedo,
  zoomLevel,
  currentLineAlign,
  isRightSidebarOpen,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSaveNow,
  onExportPDF,
  onGoBack,
  onApplyBold,
  onApplyItalic,
  onResetNormal,
  onChangeAlignment,
  onToggleRightSidebar,
}) => {
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 px-3 py-2 flex flex-row items-center justify-between gap-2 overflow-x-auto sticky top-0 z-40 select-none w-full">
      {/* Top Left back & history buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 rounded-md text-xs font-semibold transition cursor-pointer"
          title="Go back to portfolio dashboard"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        <div className="h-6 w-px bg-neutral-850" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-md text-neutral-400 hover:text-white transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-md text-neutral-400 hover:text-white transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formatting & zoom controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center my-0.5">
        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-white/10 border border-white/10 rounded-md p-1 select-none">
          <button
            onClick={onZoomOut}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold px-1 select-none text-center min-w-[32px]">
            {zoomLevel}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggle Formatting Sidebar button (Pen Icon) */}
        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center border ${
            isRightSidebarOpen 
              ? 'bg-[#97cc5b]/20 border-[#97cc5b]/40 text-[#97cc5b] hover:bg-[#97cc5b]/30' 
              : 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/15'
          }`}
          title={isRightSidebarOpen ? "Hide Formatting Sidebar" : "Show Formatting Sidebar"}
        >
          <Pen className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Manual Save & Export PDF */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 justify-end">
        {/* Subtle status label */}
        <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500 mr-1 select-none">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-neutral-500">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3 h-3 text-rose-500" />
              <span className="text-rose-400">Error</span>
            </>
          )}
        </div>

        <button
          onClick={onSaveNow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-700 border border-neutral-700 rounded-md text-xs font-semibold transition cursor-pointer"
          title="Save Script (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-450 text-neutral-950 rounded-md text-xs font-bold shadow-md shadow-amber-950/20 active:scale-[0.98] transition cursor-pointer"
          title="Export to industry PDF"
        >
          <Download className="w-3.5 h-3.5 text-neutral-950" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>
    </div>
  );
};
