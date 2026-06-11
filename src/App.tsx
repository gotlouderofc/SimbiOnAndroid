/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Compass,
  Film,
  Download,
  Trash2,
  FilePlus,
  Clock,
  Settings,
  BookOpen,
  User,
  Hash,
  ChevronRight,
  Printer,
  ChevronDown,
  Layers,
  Heading,
  Eye,
  Menu,
  ChevronLeft,
  Type,
  Move,
  Camera,
  MessageSquare,
  Home,
  ArrowRight,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Car,
  Lightbulb,
  Book,
  EyeOff,
  X,
  Save,
  ZoomIn,
  ZoomOut,
  Puzzle,
  Pen,
  Search,
  Share2,
  Upload
} from 'lucide-react';

import { Script, ScreenplayLine, ScreenplayFormat, ToastMessage, IdeaNote } from './types';
import { Storage } from './utils/storage';
import { PDFExporter } from './utils/pdfExporter';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { DetailModal } from './components/DetailModal';
import { NoteModal } from './components/NoteModal';
import { LineItem } from './components/LineItem';

// Custom Kite design SVG component
const Kite = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2L19 9L12 16L5 9Z" />
    <path d="M12 2V16" />
    <path d="M5 9H19" />
    <path d="M12 16C12.5 18.5 11.5 20.5 12.5 22.5" />
    <path d="M10.8 18.5L13.2 19.5" />
    <path d="M11.2 20.5L13.6 21.2" />
  </svg>
);

const formattingOptions: { format: ScreenplayFormat; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { format: 'scene-heading', label: 'Scene Heading', icon: <Home className="w-4 h-4" />, shortcut: 'Ctrl+1' },
  { format: 'action', label: 'Action Description', icon: <Car className="w-4 h-4" />, shortcut: 'Ctrl+2' },
  { format: 'character', label: 'Character Name', icon: <User className="w-4 h-4" />, shortcut: 'Ctrl+3' },
  { format: 'parenthetical', label: 'Parenthetical Context', icon: <span className="font-bold text-xs select-none tracking-tight font-mono">( )</span>, shortcut: 'Ctrl+4' },
  { format: 'dialogue', label: 'Dialogue Text', icon: <MessageSquare className="w-4 h-4" />, shortcut: 'Ctrl+5' },
  { format: 'transition', label: 'Transition Cue', icon: <ArrowRight className="w-4 h-4" />, shortcut: 'Ctrl+6' },
  { format: 'shot', label: 'Camera / Shot Detail', icon: <Camera className="w-4 h-4" />, shortcut: 'Ctrl+7' },
];

// Uncontrolled contentEditable editor component to prevent React re-renders from wiping input content
const FreeformNoteEditor = ({ 
  noteId, 
  initialContent,
  readOnly
}: { 
  noteId: string; 
  initialContent: string;
  readOnly: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = initialContent;
    }
  }, [noteId]);

  return (
    <div
      ref={ref}
      id="freeform-note-editor"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      className="w-full h-full min-h-[700px] outline-none text-sm leading-relaxed font-sans cursor-text text-left select-text whitespace-pre-wrap prose"
    />
  );
};

export default function App() {
  // Screenplay lists & storage management
  const [scripts, setScripts] = useState<Script[]>(() => Storage.getScripts());
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  
  // Idea Note lists & states
  const [notes, setNotes] = useState<IdeaNote[]>(() => Storage.getNotes());
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<IdeaNote | null>(null);
  const [noteEditMode, setNoteEditMode] = useState<'edit' | 'read'>('edit');
  const [isNoteSidebarOpen, setIsNoteSidebarOpen] = useState<boolean>(true);

  // Idea Note modal states
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [noteModalMode, setNoteModalMode] = useState<'create' | 'edit'>('create');
  const [noteModalInitialData, setNoteModalInitialData] = useState<Partial<IdeaNote> | undefined>(undefined);
  
  // Active script detail states
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [lines, setLines] = useState<ScreenplayLine[]>([]);
  const [focusedLineIdx, setFocusedLineIdx] = useState<number>(0);
  
  // Custom interface and layout configurations
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isScriptRightFormattingOpen, setIsScriptRightFormattingOpen] = useState<boolean>(true);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Find & Replace state fields
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [findMatchesCount, setFindMatchesCount] = useState<number | null>(null);

  // Custom delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    title: string;
    type: 'script' | 'note';
  } | null>(null);

  // Share modal states for custom .simbidoc format
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [sharingItem, setSharingItem] = useState<any>(null);
  const [sharingType, setSharingType] = useState<'script' | 'note' | null>(null);

  // Autofocus synchronization state variables
  const pendingFocusRef = useRef<{ index: number; caretPosition: 'start' | 'end' | number } | null>(null);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);

  // Edit / Creation modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalInitialData, setModalInitialData] = useState<Partial<Script> | undefined>(undefined);

  // Custom persistent notify toast channel
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // History system ref variables (undo / redo)
  const historyRef = useRef<ScreenplayLine[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoingOrRedoingRef = useRef<boolean>(false);
  const lastEditedLineIdRef = useRef<string | null>(null);
  const lastSpacePressedRef = useRef<boolean>(false);

  // Saving state checks
  const lastSavedJsonRef = useRef<string>('');
  const activeNoteRef = useRef<IdeaNote | null>(null);
  activeNoteRef.current = activeNote;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // Synchronize from local list when list updates
  const refreshScripts = () => {
    setScripts(Storage.getScripts());
    setNotes(Storage.getNotes());
  };

  // Launch editing script
  const handleOpenScript = (id: string) => {
    const script = Storage.getScript(id);
    if (script) {
      setActiveScript(script);
      setLines(script.content || []);
      setCurrentScriptId(id);
      
      // Seed initial history
      historyRef.current = [JSON.parse(JSON.stringify(script.content))];
      historyIndexRef.current = 0;
      lastSavedJsonRef.current = JSON.stringify(script.content);
      
      showToast(`Loaded "${script.title}"`, 'success');
    } else {
      showToast('Could not load script details.', 'error');
    }
  };

  // Close script editor and back to catalogue
  const handleCloseEditor = () => {
    if (activeScript) {
      // Final save
      const finalScript = {
        ...activeScript,
        content: lines,
        updatedAt: new Date().toISOString()
      };
      Storage.saveScript(finalScript);
    }
    setCurrentScriptId(null);
    setActiveScript(null);
    setLines([]);
    refreshScripts();
  };

  // Manual save trigger
  const handleManualSave = () => {
    if (!activeScript) return;
    setSaveStatus('saving');
    const updatedScript: Script = {
      ...activeScript,
      content: lines,
      updatedAt: new Date().toISOString()
    };
    Storage.saveScript(updatedScript);
    lastSavedJsonRef.current = JSON.stringify(lines);
    setSaveStatus('saved');
    showToast('All progress saved securely', 'success');
  };

  // Background auto-save (checks every 4 seconds)
  useEffect(() => {
    if (!activeScript || currentScriptId === null) return;
    
    const interval = setInterval(() => {
      const currentJson = JSON.stringify(lines);
      if (currentJson !== lastSavedJsonRef.current) {
        setSaveStatus('saving');
        const updatedScript: Script = {
          ...activeScript,
          content: lines,
          updatedAt: new Date().toISOString()
        };
        Storage.saveScript(updatedScript);
        lastSavedJsonRef.current = currentJson;
        
        // Timeout status to saved
        setTimeout(() => {
          setSaveStatus('saved');
        }, 500);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [lines, activeScript, currentScriptId]);

  // Handle PDF Export
  const handleExportPDF = (scriptToExport?: Script) => {
    let target = scriptToExport;
    
    // Save current editor state before export and merge latest line edits
    if (!target && activeScript) {
      target = {
        ...activeScript,
        content: lines,
        updatedAt: new Date().toISOString()
      };
      Storage.saveScript(target);
      setActiveScript(target);
    }
    
    if (!target) return;

    try {
      PDFExporter.export(target);
      showToast('Successfully generated production PDF', 'success');
    } catch (e) {
      showToast('PDF Export encountered an error.', 'error');
    }
  };

  // Delete script
  const handleDeleteScript = (id: string, title: string) => {
    setDeleteConfirmation({ id, title, type: 'script' });
  };

  // Trigger New Script Modal
  const openNewScriptModal = () => {
    setModalMode('create');
    setModalInitialData({ title: '', writer: '' });
    setIsModalOpen(true);
  };

  // Save changes from Modal (Creates or Edits script metadata)
  const handleSaveModalData = (data: Partial<Script>) => {
    if (modalMode === 'create') {
      const newScript: Script = {
        id: 'script_' + Date.now().toString(),
        title: data.title || 'Untitled',
        writer: data.writer || 'Unknown Writer',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: [
          { id: 'l1', format: 'scene-heading', text: 'INT. LOCATION - DAY' },
          { id: 'l2', format: 'action', text: 'Introduce the scene here.' }
        ]
      };
      Storage.saveScript(newScript);
      refreshScripts();
      handleOpenScript(newScript.id);
    } else {
      if (activeScript) {
        const updated = {
          ...activeScript,
          ...data,
          updatedAt: new Date().toISOString()
        };
        setActiveScript(updated);
        Storage.saveScript(updated);
        refreshScripts();
        showToast('Screenplay settings updated', 'success');
      }
    }
  };

  // Handle selecting a search result and loading it
  const handleSelectSearchResult = (id: string, type: 'script' | 'note') => {
    setIsSearchOpen(false);
    
    if (activeScript) {
      handleCloseEditor();
    }
    if (activeNote) {
      handleCloseNoteEditor();
    }

    // Switch view to the chosen document
    setTimeout(() => {
      if (type === 'script') {
        handleOpenScript(id);
      } else if (type === 'note') {
        handleOpenNote(id);
      }
    }, 50);
  };

  // Dynamically load PDF.js client-side library from web CDN safely
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        // Point worker to cdn matching the same version
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (e) => reject(new Error('Failed to load PDF.js tool from CDN.'));
      document.head.appendChild(script);
    });
  };

  // Joint importer for screenplay documents - disassembles PDF and loads .simbidoc files
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.simbidoc')) {
      showToast('Reading and decoding Simbi document...', 'info');
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.simbiSign !== "SIMBI_DOCUMENT_v1") {
          showToast('Invalid Simbi document file signature.', 'error');
          return;
        }

        const type = data.docType;
        const payload = data.payload;

        if (!payload || !payload.title) {
          showToast('Missing document payload inside .simbidoc file.', 'error');
          return;
        }

        // Generate a new ID to avoid duplicating identical storage records unless intended
        const newId = (type === 'script' ? 'script_' : 'note_') + Date.now();
        const docTitle = payload.title;

        if (type === 'script') {
          const importedScript: Script = {
            ...payload,
            id: newId,
            createdAt: payload.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          Storage.saveScript(importedScript);
          refreshScripts();
          handleOpenScript(newId);
          showToast(`Direct imported screenplay: "${docTitle}"`, 'success');
        } else {
          const importedNote: IdeaNote = {
            ...payload,
            id: newId,
            createdAt: payload.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          Storage.saveNote(importedNote);
          refreshScripts();
          handleOpenNote(newId);
          showToast(`Direct imported workspace note: "${docTitle}"`, 'success');
        }
      } catch (err: any) {
        console.error('SimbiDoc import error:', err);
        showToast('Failed to parse and extract the .simbidoc file.', 'error');
      }

      // Reset input element value to allow continuous updates
      e.target.value = '';
    } else if (fileName.endsWith('.pdf')) {
      showToast('Importing and disassembling screenplay PDF...', 'info');

      try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let allLines: ScreenplayLine[] = [];
        let idCounter = 1;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const rawItems = textContent.items as any[];
          if (rawItems.length === 0) continue;

          // Merge raw items into rows with a visual alignment threshold
          const rows: { y: number; items: any[] }[] = [];
          const threshold = 4; // Vertical pixel tolerance of letters inside the same horizontal line row

          rawItems.forEach(item => {
            if (!item.str || !item.str.trim()) return;
            const y = item.transform[5];
            
            const existingRow = rows.find(r => Math.abs(r.y - y) <= threshold);
            if (existingRow) {
              existingRow.items.push(item);
            } else {
              rows.push({ y, items: [item] });
            }
          });

          // Top of screen matches higher Y in standard PDF coordinate system, sort top-to-bottom
          rows.sort((a, b) => b.y - a.y);

          rows.forEach(row => {
            // Sort character items left-to-right (by X coordinate)
            row.items.sort((a, b) => a.transform[4] - b.transform[4]);
            
            const combinedText = row.items.map(item => item.str).join(' ').trim();
            if (!combinedText) return;

            // Extract first item left coordinate X margin
            const xCoord = row.items[0].transform[4];
            let format: ScreenplayFormat = 'action';
            const upperText = combinedText.toUpperCase();

            // Rule 1: Scene Headings
            if (
              upperText.startsWith('INT.') || 
              upperText.startsWith('EXT.') || 
              upperText.startsWith('INT/EXT') || 
              upperText.startsWith('EXT/INT') ||
              upperText.startsWith('I/E') ||
              upperText.startsWith('EST.')
            ) {
              format = 'scene-heading';
            }
            // Rule 2: Parentheticals
            else if (combinedText.startsWith('(') && combinedText.endsWith(')')) {
              format = 'parenthetical';
            }
            // Rule 3: Transitions (Right-aligned / upper-case format indicators)
            else if (xCoord > 350 && (upperText.endsWith('TO:') || upperText.startsWith('FADE OUT') || upperText.startsWith('FADE IN'))) {
              format = 'transition';
            }
            // Rule 4: Characters (Indented towards center or uppercase short items)
            else if (upperText === combinedText && combinedText.length > 0 && isNaN(Number(combinedText))) {
              if (xCoord > 180 && xCoord < 330) {
                format = 'character';
              } else {
                format = xCoord > 180 ? 'character' : 'action';
              }
            }
            // Rule 5: Dialogue (Indented but wider than character)
            else {
              if (xCoord > 130 && xCoord < 230) {
                format = 'dialogue';
              } else {
                format = 'action';
              }
            }

            allLines.push({
              id: `l-${Date.now()}-${idCounter++}`,
              format,
              text: combinedText
            });
          });
        }

        // Secondary parsing pass to auto-correct loose dialogue chunks to their uppercase characters
        for (let i = 1; i < allLines.length; i++) {
          const prev = allLines[i - 1];
          const curr = allLines[i];
          if ((prev.format === 'character' || prev.format === 'parenthetical') && curr.format === 'action') {
            if (curr.text.length < 300) {
              curr.format = 'dialogue';
            }
          }
        }

        const docTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');

        const newScript: Script = {
          id: 'script_' + Date.now().toString(),
          title: docTitle,
          writer: 'Imported PDF',
          notes: `Disassembled screenplay script imported from input file: ${file.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: allLines.length > 0 ? allLines : [
            { id: 'l1', format: 'scene-heading', text: 'INT. IMPORTED SCREENPLAY - DAY' },
            { id: 'l2', format: 'action', text: 'This file text could not be decomposed. Please check PDF type.' }
          ]
        };

        Storage.saveScript(newScript);
        refreshScripts();
        handleOpenScript(newScript.id);
        showToast(`Successfully imported and disassembled "${docTitle}"!`, 'success');
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        showToast('Error parsing text from this PDF file.', 'error');
      }

      // Reset target input to support selecting the same file consecutively
      e.target.value = '';
    } else {
      showToast('Unsupported format file selected', 'error');
    }
  };

  // Share triggers
  const handleOpenShare = (item: any, type: 'script' | 'note') => {
    setSharingItem(item);
    setSharingType(type);
    setIsShareModalOpen(true);
  };

  const handleSystemShare = async () => {
    if (!sharingItem || !sharingType) return;
    
    const docTitle = sharingItem.title || 'Untitled';
    const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.simbidoc`;
    
    const simbiDocContent = {
      simbiSign: "SIMBI_DOCUMENT_v1",
      docType: sharingType,
      payload: sharingItem
    };
    
    const docString = JSON.stringify(simbiDocContent, null, 2);
    const blob = new Blob([docString], { type: 'application/octet-stream' });
    const file = new File([blob], filename, { type: 'application/octet-stream' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Simbi Document - ${docTitle}`,
          text: `Check out my Simbi draft: "${docTitle}"! You can import this .simbidoc file directly into your own app instance.`
        });
        showToast('Shared successfully!', 'success');
      } catch (err: any) {
        console.warn('System native share failed, falling back to download:', err);
        triggerFileDownload(docString, filename);
      }
    } else {
      triggerFileDownload(docString, filename);
      showToast('Downloaded .simbidoc file to your storage. You can attach it safely to share!', 'success');
    }
  };

  const triggerFileDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Find text occurrences in current screenplay (case-insensitive)
  const handleFindText = () => {
    if (!findQuery.trim()) {
      showToast('Please enter a word to search.', 'info');
      return;
    }
    const q = findQuery.trim().toLowerCase();
    let totalCount = 0;
    lines.forEach(line => {
      if (line.text) {
        const rawText = line.text.toLowerCase();
        let pos = rawText.indexOf(q);
        while (pos !== -1) {
          totalCount++;
          pos = rawText.indexOf(q, pos + q.length);
        }
      }
    });
    setFindMatchesCount(totalCount);
    showToast(`Found ${totalCount} matching occurrences in this script.`, 'info');
  };

  // Replace text occurrences in current screenplay (case-insensitive find, custom replace)
  const handleReplaceText = () => {
    if (!findQuery.trim()) {
      showToast('Please specify what to find first.', 'error');
      return;
    }

    const q = findQuery.trim();
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'gi');
    const repVal = replaceQuery;

    let replacedCount = 0;

    const updatedLines = lines.map(line => {
      if (line.text) {
        const matchArray = line.text.match(regex);
        if (matchArray) {
          replacedCount += matchArray.length;
          const newText = line.text.replace(regex, repVal);
          return {
            ...line,
            text: newText
          };
        }
      }
      return line;
    });

    if (replacedCount === 0) {
      showToast(`No occurrences of "${q}" were found in the script to replace.`, 'info');
      return;
    }

    // Update states
    setLines(updatedLines);

    // Save immediately and push to state so the workspace lists refresh
    if (activeScript) {
      const finalScript = {
        ...activeScript,
        content: updatedLines,
        updatedAt: new Date().toISOString()
      };
      Storage.saveScript(finalScript);
      setActiveScript(finalScript);
      refreshScripts();
    }

    showToast(`Replaced ${replacedCount} occurrences of "${q}" with "${repVal}".`, 'success');

    // Reset search counts and search state
    setFindMatchesCount(null);
    setFindQuery('');
    setReplaceQuery('');
    setIsFindReplaceOpen(false);
  };

  // Launch editing note
  const handleOpenNote = (id: string) => {
    const note = Storage.getNote(id);
    if (note) {
      setActiveNote(note);
      setCurrentNoteId(id);
      setNoteEditMode('edit');
      lastSavedJsonRef.current = note.content || '';
      showToast(`Loaded "${note.title}"`, 'success');
    } else {
      showToast('Could not load note details.', 'error');
    }
  };

  // Close note and back to portfolio
  const handleCloseNoteEditor = () => {
    if (activeNote) {
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      const htmlContent = el ? el.innerHTML : activeNote.content;
      const finalNote = {
        ...activeNote,
        content: htmlContent,
        updatedAt: new Date().toISOString()
      };
      Storage.saveNote(finalNote);
    }
    setCurrentNoteId(null);
    setActiveNote(null);
    refreshScripts();
  };

  // Manual save for active note
  const handleManualSaveNote = () => {
    if (!activeNote) return;
    setSaveStatus('saving');
    const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
    const htmlContent = el ? el.innerHTML : activeNote.content;
    const updatedNote: IdeaNote = {
      ...activeNote,
      content: htmlContent,
      updatedAt: new Date().toISOString()
    };
    Storage.saveNote(updatedNote);
    setActiveNote(updatedNote);
    lastSavedJsonRef.current = htmlContent;
    setSaveStatus('saved');
    showToast('All progress saved securely', 'success');
  };

  // Auto-save routine for open note
  useEffect(() => {
    if (currentNoteId === null) return;
    
    const interval = setInterval(() => {
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      if (!el || !activeNoteRef.current) return;
      const currentHtml = el.innerHTML || '';
      
      if (currentHtml !== lastSavedJsonRef.current) {
        setSaveStatus('saving');
        const updatedNote: IdeaNote = {
          ...activeNoteRef.current,
          content: currentHtml,
          updatedAt: new Date().toISOString()
        };
        Storage.saveNote(updatedNote);
        setActiveNote(updatedNote);
        lastSavedJsonRef.current = currentHtml;
        
        setTimeout(() => {
          setSaveStatus('saved');
        }, 500);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentNoteId]);

  // Export note to PDF
  const handleExportNotePDF = (noteToExport?: IdeaNote) => {
    let target = noteToExport;
    
    if (!target && activeNote) {
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      const htmlContent = el ? el.innerHTML : activeNote.content;
      target = {
        ...activeNote,
        content: htmlContent,
        updatedAt: new Date().toISOString()
      };
      Storage.saveNote(target);
      setActiveNote(target);
    }
    
    if (!target) return;

    try {
      PDFExporter.exportNote(target);
      showToast('Successfully generated document PDF', 'success');
    } catch (e) {
      showToast('PDF Export encountered an error.', 'error');
    }
  };

  // Delete note
  const handleDeleteNote = (id: string, title: string) => {
    setDeleteConfirmation({ id, title, type: 'note' });
  };

  // Execute delete after confirmation
  const executeDelete = () => {
    if (!deleteConfirmation) return;
    const { id, title, type } = deleteConfirmation;
    if (type === 'script') {
      Storage.deleteScript(id);
      showToast(`Deleted "${title}"`, 'info');
    } else {
      Storage.deleteNote(id);
      showToast(`Deleted "${title}"`, 'info');
    }
    setDeleteConfirmation(null);
    refreshScripts();
  };

  // Trigger New Note Modal
  const openNewNoteModal = () => {
    setNoteModalMode('create');
    setNoteModalInitialData({ title: '', description: '' });
    setIsNoteModalOpen(true);
  };

  // Save changes from Note Modal (Creates or Edits note metadata)
  const handleSaveNoteModalData = (data: { title: string; description: string }) => {
    if (noteModalMode === 'create') {
      const newNote: IdeaNote = {
        id: 'note_' + Date.now().toString(),
        title: data.title || 'Untitled Ideas',
        description: data.description || '',
        content: `<h2><strong>${data.title || 'Untitled Ideas'} Planning</strong></h2><p>Start brainstorming and typing your freeform ideas here...</p>`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      Storage.saveNote(newNote);
      refreshScripts();
      handleOpenNote(newNote.id);
    } else {
      if (activeNote) {
        const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
        const htmlContent = el ? el.innerHTML : activeNote.content;
        const updated = {
          ...activeNote,
          title: data.title,
          description: data.description,
          content: htmlContent,
          updatedAt: new Date().toISOString()
        };
        setActiveNote(updated);
        Storage.saveNote(updated);
        refreshScripts();
        showToast('Note details updated', 'success');
      }
    }
  };

  // History recording logic
  const recordHistory = (newLines: ScreenplayLine[], merge = false) => {
    if (isUndoingOrRedoingRef.current) return;
    
    // Snip redo timeline if we were in the middle of undoes
    const index = historyIndexRef.current;
    const history = historyRef.current;
    
    const nextHistory = history.slice(0, index + 1);
    
    if (merge && nextHistory.length > 0) {
      // Update the current checkpoint in place
      nextHistory[nextHistory.length - 1] = JSON.parse(JSON.stringify(newLines));
    } else {
      nextHistory.push(JSON.parse(JSON.stringify(newLines)));
    }
    
    // Cap depth at 50 to conserve memory
    if (nextHistory.length > 50) {
      nextHistory.shift();
    }
    
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  // Edit on single script line text
  const handleLineTextChange = (id: string, text: string) => {
    const updated = lines.map(line => {
      if (line.id === id) {
        return { ...line, text };
      }
      return line;
    });
    setLines(updated);

    // Merge adjacent keystrokes into previous checkpoint unless word bounds are completed (space) or line changes
    const isSameLine = lastEditedLineIdRef.current === id;
    const endsWithSpace = text.endsWith(' ') || text.endsWith('\u00A0');
    const spaceJustPressed = endsWithSpace && !lastSpacePressedRef.current;

    const merge = isSameLine && !spaceJustPressed;

    recordHistory(updated, merge);

    lastEditedLineIdRef.current = id;
    lastSpacePressedRef.current = endsWithSpace;
  };

  // Apply visual style format (scene-heading, action, dialogue etc) to selected line
  const handleApplyFormat = (format: ScreenplayFormat) => {
    const index = focusedLineIdx;
    if (index < 0 || index >= lines.length) return;
    
    const updated = lines.map((line, idx) => {
      if (idx === index) {
        // Auto convert formatting hints if text exists & defaults apply
        let refinedText = line.text;
        if (format === 'scene-heading' && !refinedText.match(/^(INT|EXT|INT\/EXT|I\/E)\./i) && !refinedText.trim()) {
          refinedText = 'INT. LOCATION - DAY';
        }

        // Parenthetical auto-bracketing functionality
        if (format === 'parenthetical') {
          // Remove any outer HTML tags and get clean trim content
          let cleanText = refinedText.replace(/<[^>]*>/g, '').trim();
          if (cleanText.length > 0) {
            if (!cleanText.startsWith('(') || !cleanText.endsWith(')')) {
              if (cleanText.startsWith('(')) cleanText = cleanText.substring(1).trim();
              if (cleanText.endsWith(')')) cleanText = cleanText.substring(0, cleanText.length - 1).trim();
              refinedText = `(${cleanText})`;
            }
          } else {
            refinedText = '()';
          }
        } else if ((line.format as string) === 'parenthetical') {
          // Switching away from parenthetical: Strip outer parenthesis if present
          let cleanText = refinedText.replace(/<[^>]*>/g, '').trim();
          if (cleanText.startsWith('(') && cleanText.endsWith(')')) {
            refinedText = cleanText.substring(1, cleanText.length - 1).trim();
          }
        }

        return { ...line, format, text: refinedText };
      }
      return line;
    });
    setLines(updated);
    recordHistory(updated);
    
    // Retain focus
    focusLine(index, 'end');
  };

  // Trigger inline bold style on highlight and synchronize state
  const handleApplyBold = () => {
    document.execCommand('bold', false);
    if (currentNoteId !== null) {
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      if (el && activeNote) {
        lastSavedJsonRef.current = el.innerHTML;
      }
      return;
    }
    const index = focusedLineIdx;
    if (index >= 0 && index < lines.length) {
      const line = lines[index];
      const el = document.getElementById(`line-${line.id}`) as HTMLDivElement;
      if (el) {
        handleLineTextChange(line.id, el.innerHTML);
      }
    }
  };

  // Trigger inline italic style on highlight and synchronize state
  const handleApplyItalic = () => {
    document.execCommand('italic', false);
    if (currentNoteId !== null) {
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      if (el && activeNote) {
        lastSavedJsonRef.current = el.innerHTML;
      }
      return;
    }
    const index = focusedLineIdx;
    if (index >= 0 && index < lines.length) {
      const line = lines[index];
      const el = document.getElementById(`line-${line.id}`) as HTMLDivElement;
      if (el) {
        handleLineTextChange(line.id, el.innerHTML);
      }
    }
  };

  // Reset standard formatted text selections and remove lines alignments
  const handleResetNormalFormatting = () => {
    document.execCommand('removeFormat', false);
    if (currentNoteId !== null) {
      document.execCommand('justifyLeft', false);
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      if (el && activeNote) {
        lastSavedJsonRef.current = el.innerHTML;
      }
      return;
    }
    const index = focusedLineIdx;
    if (index >= 0 && index < lines.length) {
      const line = lines[index];
      const el = document.getElementById(`line-${line.id}`) as HTMLDivElement;
      const cleanHtml = el ? el.innerHTML : line.text;
      const updated = lines.map((l, idx) => {
        if (idx === index) {
          return { ...l, text: cleanHtml, align: undefined };
        }
        return l;
      });
      setLines(updated);
      recordHistory(updated);
    }
  };

  // Update alignment state for specific script lines
  const handleChangeAlignment = (align?: 'left' | 'center' | 'right') => {
    if (currentNoteId !== null) {
      if (align === 'left') document.execCommand('justifyLeft', false);
      else if (align === 'center') document.execCommand('justifyCenter', false);
      else if (align === 'right') document.execCommand('justifyRight', false);
      const el = document.getElementById('freeform-note-editor') as HTMLDivElement;
      if (el && activeNote) {
        lastSavedJsonRef.current = el.innerHTML;
      }
      return;
    }
    const index = focusedLineIdx;
    if (index >= 0 && index < lines.length) {
      const updated = lines.map((l, idx) => {
        if (idx === index) {
          return { ...l, align };
        }
        return l;
      });
      setLines(updated);
      recordHistory(updated);
    }
  };

  // Keyboard navigation utility: Places browser carat at the end or start of custom element
  const focusLine = (index: number, caretPosition: 'start' | 'end' | number = 'end') => {
    if (index < 0 || index >= lines.length) return;
    pendingFocusRef.current = { index, caretPosition };
    setFocusedLineIdx(index);
    setFocusTrigger(prev => prev + 1);
  };

  // Safe layout-commit autofocus effect to eliminate race conditions
  useEffect(() => {
    if (pendingFocusRef.current !== null) {
      const { index, caretPosition } = pendingFocusRef.current;
      const line = lines[index];
      if (line) {
        const el = document.getElementById(`line-${line.id}`) as HTMLDivElement;
        
        const applyFocus = (targetEl: HTMLDivElement) => {
          targetEl.focus();
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            if (caretPosition === 'start') {
              range.selectNodeContents(targetEl);
              range.collapse(true);
            } else if (caretPosition === 'end') {
              range.selectNodeContents(targetEl);
              range.collapse(false);
            } else if (typeof caretPosition === 'number') {
              const firstChild = targetEl.firstChild || targetEl;
              const textLen = targetEl.textContent?.length || 0;
              const targetOffset = Math.min(caretPosition, textLen);
              try {
                range.setStart(firstChild, targetOffset);
                range.setEnd(firstChild, targetOffset);
              } catch {
                range.selectNodeContents(targetEl);
                range.collapse(false);
              }
            }
            selection.removeAllRanges();
            selection.addRange(range);
          }
          pendingFocusRef.current = null; // Mark completed
        };

        if (el) {
          applyFocus(el);
        } else {
          // Defer focus execution to next layout reflow loop if element is not yet spawned in the DOM
          const rafId = requestAnimationFrame(() => {
            const retryEl = document.getElementById(`line-${line.id}`) as HTMLDivElement;
            if (retryEl) {
              applyFocus(retryEl);
            }
          });
          return () => cancelAnimationFrame(rafId);
        }
      }
    }
  }, [lines, focusedLineIdx, focusTrigger]);

  // Helper: Query offset in ContentEditable characters
  const getCaretCharacterOffsetWithin = (element: HTMLElement) => {
    let caretOffset = 0;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  };

  // Physical key routing
  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const currentLine = lines[index];
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const caretOffset = getCaretCharacterOffsetWithin(e.currentTarget);
      const fullText = currentLine.text;
      
      const leftText = fullText.substring(0, caretOffset);
      const rightText = fullText.substring(caretOffset);

      // Smart next format selection
      let nextFormat: ScreenplayFormat = 'action';
      if (currentLine.format === 'scene-heading') nextFormat = 'action';
      else if (currentLine.format === 'character') nextFormat = 'dialogue';
      else if (currentLine.format === 'parenthetical') nextFormat = 'dialogue';
      else if (currentLine.format === 'dialogue') nextFormat = 'action';
      else if (currentLine.format === 'transition') nextFormat = 'scene-heading';
      else if (currentLine.format === 'shot') nextFormat = 'action';

      // Assemble lines
      const currentLineMod: ScreenplayLine = {
        ...currentLine,
        text: leftText
      };

      const newLine: ScreenplayLine = {
        id: 'line_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
        format: nextFormat,
        text: rightText
      };

      const nextLines = [...lines];
      nextLines[index] = currentLineMod;
      nextLines.splice(index + 1, 0, newLine);

      setLines(nextLines);
      recordHistory(nextLines);
      
      setFocusedLineIdx(index + 1);
      focusLine(index + 1, 'start');
      
    } else if (e.key === 'Backspace') {
      const caretOffset = getCaretCharacterOffsetWithin(e.currentTarget);
      
      if (caretOffset === 0) {
        // Intercept boundary backspace deletion/merge
        e.preventDefault();
        
        if (index > 0) {
          const prevLine = lines[index - 1];
          const prevTextLength = prevLine.text.length;
          const mergedText = prevLine.text + currentLine.text;

          // Merge current line into previous
          const updatedPrevLine: ScreenplayLine = {
            ...prevLine,
            text: mergedText
          };

          const nextLines = [...lines];
          nextLines[index - 1] = updatedPrevLine;
          nextLines.splice(index, 1);

          setLines(nextLines);
          recordHistory(nextLines);
          
          setFocusedLineIdx(index - 1);
          focusLine(index - 1, prevTextLength);
        }
      }
    } else if (e.key === 'ArrowUp') {
      const caretOffset = getCaretCharacterOffsetWithin(e.currentTarget);
      if (caretOffset === 0 && index > 0) {
        e.preventDefault();
        setFocusedLineIdx(index - 1);
        focusLine(index - 1, 'end');
      }
    } else if (e.key === 'ArrowDown') {
      const caretOffset = getCaretCharacterOffsetWithin(e.currentTarget);
      const textLen = currentLine.text.length;
      if (caretOffset >= textLen && index < lines.length - 1) {
        e.preventDefault();
        setFocusedLineIdx(index + 1);
        focusLine(index + 1, 'start');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab cycle sequence
      const formats: ScreenplayFormat[] = [
        'scene-heading',
        'action',
        'character',
        'parenthetical',
        'dialogue',
        'transition',
        'shot'
      ];
      const currentIdx = formats.indexOf(currentLine.format);
      const nextIdx = (currentIdx + 1) % formats.length;
      handleApplyFormat(formats[nextIdx]);
    }
  };

  // Global hotkeys handler (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+1..7)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow execution only inside script view
      if (currentScriptId === null) return;
      
      const isCmd = e.ctrlKey || e.metaKey;

      if (isCmd) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleManualSave();
        } else if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
          e.preventDefault();
          const formatsMap: Record<string, ScreenplayFormat> = {
            '1': 'scene-heading',
            '2': 'action',
            '3': 'character',
            '4': 'parenthetical',
            '5': 'dialogue',
            '6': 'transition',
            '7': 'shot'
          };
          handleApplyFormat(formatsMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentScriptId, lines, focusedLineIdx, activeScript]);

  // History Operations (Undo / Redo)
  const handleUndo = () => {
    const index = historyIndexRef.current;
    if (index > 0) {
      isUndoingOrRedoingRef.current = true;
      const prevIdx = index - 1;
      historyIndexRef.current = prevIdx;
      
      const prevLines = JSON.parse(JSON.stringify(historyRef.current[prevIdx]));
      setLines(prevLines);
      showToast('Undo action', 'info');
      
      // Select last known focused line boundaries
      const targetIdx = Math.min(focusedLineIdx, prevLines.length - 1);
      setTimeout(() => {
        focusLine(targetIdx, 'end');
        isUndoingOrRedoingRef.current = false;
      }, 30);
    }
  };

  const handleRedo = () => {
    const index = historyIndexRef.current;
    const history = historyRef.current;
    if (index < history.length - 1) {
      isUndoingOrRedoingRef.current = true;
      const nextIdx = index + 1;
      historyIndexRef.current = nextIdx;
      
      const nextLines = JSON.parse(JSON.stringify(history[nextIdx]));
      setLines(nextLines);
      showToast('Redo action', 'info');
      
      const targetIdx = Math.min(focusedLineIdx, nextLines.length - 1);
      setTimeout(() => {
        focusLine(targetIdx, 'end');
        isUndoingOrRedoingRef.current = false;
      }, 30);
    }
  };

  // Zoom adjustments
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(150, prev + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(70, prev - 10));
  };

  const handleJumpToScene = (index: number) => {
    setFocusedLineIdx(index);
    focusLine(index, 'start');
    
    // Smooth scrolling to center lines
    const lineEl = document.getElementById(`line-${lines[index].id}`);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Formatter Date helper
  const formatDateStr = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Estimate total word counts
  const getWordCount = (script: Script, liveCount?: boolean) => {
    const items = liveCount ? lines : (script.content || []);
    return items.reduce((sum, line) => {
      const words = line.text ? line.text.trim().split(/\s+/).filter(Boolean).length : 0;
      return sum + words;
    }, 0);
  };

  // Estimate pages count (Industry standard: 1 page = ~250 words index)
  const getPagesCount = (script: Script, liveCount?: boolean) => {
    const words = getWordCount(script, liveCount);
    return Math.max(1, Math.ceil(words / 230));
  };

  // Filter scenes for current active loaded doc
  const activeScenes = lines
    .map((line, idx) => ({ line, index: idx }))
    .filter(item => item.line.format === 'scene-heading');

  const currentSelectionFormat = lines[focusedLineIdx]?.format || 'action';

  return (
    <div id="screenwriter-app" className="h-screen w-screen flex flex-col bg-[#FAF9F6] text-neutral-950 font-sans antialiased overflow-hidden select-none">
      
      {/* Toast Alert stack popup */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[280px] sm:max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-2.5 py-1.5 rounded-md shadow-lg text-neutral-900 border text-[11px] font-semibold flex items-center gap-1.5 animate-slide-up pointer-events-auto transition-all ${
              t.type === 'success'
                ? 'bg-[#EBF4E2] border-neutral-200 text-[#426a19]'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {currentScriptId === null && currentNoteId === null ? (
        // ============================================
        // CATALOGUE HOME SCREEN
        // ============================================
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] select-text overflow-y-auto">
          {/* Main Top Header bar */}
          <header className="border-b border-neutral-200 bg-white sticky top-0 backdrop-blur-md z-30 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#97cc5b] text-neutral-950 font-black flex items-center justify-center rounded-xl text-lg tracking-tighter selection:bg-neutral-100 shadow-md shadow-[#97cc5b]/10">
                  S
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900 simbi-logo-gradient">
                    Simbi
                  </h1>
                </div>
              </div>
              <div className="flex flex-row items-center gap-3 shrink-0">
                <button
                  onClick={openNewScriptModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 font-bold rounded-lg text-xs tracking-tight shadow-md shadow-[#97cc5b]/10 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-neutral-950" />
                  <span>Script</span>
                </button>
                <button
                  onClick={openNewNoteModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-bold rounded-lg text-xs tracking-tight shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4 text-[#5d8f25]" />
                  <span>Idea</span>
                </button>
              </div>
            </div>
          </header>

          {/* Central content container */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-8">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#97cc5b]" />
                <h2 className="text-sm font-black uppercase text-neutral-600 tracking-wider">Dear Storyteller</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Hidden browser PDF / SimbiDoc upload input */}
                <input
                  type="file"
                  id="pdf-upload-input"
                  accept=".pdf,.simbidoc"
                  className="hidden"
                  onChange={handleImportFile}
                />
                
                {/* Search icon button */}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#97cc5b]/10 hover:text-[#5d8f25] text-neutral-500 rounded-lg text-xs font-bold transition duration-150 border border-neutral-200 hover:border-[#cee7aa] active:scale-95 cursor-pointer shadow-sm bg-white"
                  title="Search scripts and notes"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>

                {/* Import PDF side-by-side button prompt */}
                <label
                  htmlFor="pdf-upload-input"
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#97cc5b]/10 hover:text-[#5d8f25] text-neutral-500 rounded-lg text-xs font-bold transition duration-150 border border-neutral-200 hover:border-[#cee7aa] active:scale-95 cursor-pointer shadow-sm bg-white"
                  title="Upload screenplay PDF to disassemble"
                >
                  <Upload className="w-3.5 h-3.5 text-[#5d8f25]" />
                  <span>Import</span>
                </label>
              </div>
            </div>

            {(() => {
              const portfolioItems = [
                ...scripts.map(s => ({ ...s, itemType: 'script' as const })),
                ...notes.map(n => ({ ...n, itemType: 'note' as const }))
              ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

              if (portfolioItems.length === 0) {
                return (
                  <div className="border-2 border-dashed border-neutral-200 rounded-2xl py-20 px-8 text-center flex flex-col items-center justify-center bg-white max-w-xl mx-auto mt-6 shadow-sm">
                    <FilePlus className="w-12 h-12 text-neutral-700 mb-4 stroke-[1.5]" />
                    <h3 className="text-sm font-bold text-neutral-300">No creative drafts or idea notes yet</h3>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1.5 leading-relaxed">
                      Start drafting modern screenplays or capturing freeform ideas, brainstorms, planning logs, and character notes.
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={openNewScriptModal}
                        className="px-4 py-2 bg-[#97cc5b] text-neutral-950 hover:bg-[#86b84f] font-bold rounded-lg text-xs tracking-tight shadow-sm transition"
                      >
                        Add Script
                      </button>
                      <button
                        onClick={openNewNoteModal}
                        className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 font-bold rounded-lg text-xs tracking-tight shadow-sm border border-neutral-200 transition"
                      >
                        Add Idea
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioItems.map((item) => {
                    if (item.itemType === 'script') {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenScript(item.id)}
                          className="group bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 hover:border-amber-500/60 ring-amber-500/20 hover:ring-2 cursor-pointer transition flex flex-col relative select-none"
                        >
                          <div className="flex-1">
                            <span className="absolute top-4 right-4 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-500/20">
                              Screenplay 🎥
                            </span>
                            {/* Script title heading */}
                            <h3 className="text-base font-bold text-neutral-200 group-hover:text-amber-400 transition truncate pr-20 pt-1">
                              {item.title || 'Untitled screenplay'}
                            </h3>
                            {/* Screenwriter details */}
                            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5 font-medium">
                              <User className="w-3.5 h-3.5 text-neutral-600" />
                              by {item.writer || 'Unknown writer'}
                            </p>

                            {/* Script specs and updates */}
                            <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-6 pt-4 border-t border-neutral-800/40 font-mono">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3 text-neutral-600" />
                                <span>{getPagesCount(item as Script)} {getPagesCount(item as Script) === 1 ? 'page' : 'pages'}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-600" />
                                <span>Saved {formatDateStr(item.updatedAt)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Desktop Hover card actions list */}
                          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800/60 w-full" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenScript(item.id)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-[#cee7aa] rounded-md text-[11px] font-semibold cursor-pointer transition border border-neutral-750"
                            >
                              Open Draft
                            </button>
                            <button
                              onClick={() => handleOpenShare(item, 'script')}
                              className="p-1.5 hover:bg-neutral-800 hover:text-amber-500 rounded-md transition text-neutral-500"
                              title="Share Screenplay Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExportPDF(item as Script)}
                              className="p-1.5 hover:bg-neutral-800 hover:text-amber-500 rounded-md transition text-neutral-500"
                              title="Download PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteScript(item.id, item.title)}
                              className="p-1.5 hover:bg-rose-950/60 hover:text-rose-400 rounded-md transition text-neutral-500"
                              title="Delete screen file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenNote(item.id)}
                          className="group bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 hover:border-[#97cc5b]/60 ring-[#97cc5b]/20 hover:ring-2 cursor-pointer transition flex flex-col relative select-none"
                        >
                          <div className="flex-1">
                            <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#97cc5b]/10 text-[#97cc5b] rounded-md text-[9px] font-black uppercase tracking-wider border border-[#97cc5b]/20">
                              Ideas Note 💡
                            </span>
                            {/* Note title heading */}
                            <h3 className="text-base font-bold text-neutral-200 group-hover:text-[#97cc5b] transition truncate pr-20 pt-1">
                              {item.title || 'Untitled note'}
                            </h3>
                            {/* Description text */}
                            <p className="text-xs text-neutral-400 mt-2 line-clamp-2 italic font-normal">
                              {item.description || 'No description provided.'}
                            </p>

                            {/* Detail specs and updates */}
                            <div className="flex items-center gap-4 text-[10px] text-neutral-500 mt-6 pt-4 border-t border-neutral-800/40 font-mono">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-neutral-600" />
                                <span>Freeform Document</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-600" />
                                <span>Saved {formatDateStr(item.updatedAt)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Hover card actions list */}
                          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800/60 w-full" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenNote(item.id)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-[#cee7aa] rounded-md text-[11px] font-semibold cursor-pointer transition border border-neutral-750"
                            >
                              Open Note
                            </button>
                            <button
                              onClick={() => handleOpenShare(item, 'note')}
                              className="p-1.5 hover:bg-neutral-800 hover:text-[#97cc5b] rounded-md transition text-neutral-500"
                              title="Share Idea Note"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExportNotePDF(item as IdeaNote)}
                              className="p-1.5 hover:bg-neutral-800 hover:text-[#97cc5b] rounded-md transition text-neutral-500"
                              title="Download PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(item.id, item.title)}
                              className="p-1.5 hover:bg-rose-950/60 hover:text-rose-400 rounded-md transition text-neutral-500"
                              title="Delete note draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              );
            })()}
          </main>
        </div>
      ) : currentScriptId !== null ? (
        // ============================================
        // SCRIPT EDITOR WORKSPACE
        // ============================================
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] relative">
          
          {/* Main Top bar toolbar component */}
          <Toolbar
            title={activeScript?.title || 'Unknown Film Project'}
            writer={activeScript?.writer || 'Spec Draft'}
            saveStatus={saveStatus}
            canUndo={historyIndexRef.current > 0}
            canRedo={historyIndexRef.current < historyRef.current.length - 1}
            zoomLevel={zoomLevel}
            currentLineAlign={lines[focusedLineIdx]?.align}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onSaveNow={handleManualSave}
            onExportPDF={() => handleExportPDF()}
            onGoBack={handleCloseEditor}
            onApplyBold={handleApplyBold}
            onApplyItalic={handleApplyItalic}
            onResetNormal={handleResetNormalFormatting}
            onChangeAlignment={handleChangeAlignment}
            isRightSidebarOpen={isScriptRightFormattingOpen}
            onToggleRightSidebar={() => setIsScriptRightFormattingOpen(!isScriptRightFormattingOpen)}
          />

          {/* Core Drafting Split Board Layout */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            
            {/* Top-Bar Overlay Custom Formatting Plugin Modal */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 z-50 bg-white border border-neutral-300 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 transition-all duration-300 ease-in-out select-none ${
                isExtensionModalOpen 
                  ? 'top-4 opacity-100 scale-100 pointer-events-auto shadow-2xl' 
                  : '-top-24 opacity-0 scale-95 pointer-events-none'
              }`}
              style={{ minWidth: '400px' }}
            >
              <div className="flex items-center gap-1.5 pl-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <Puzzle className="w-4 h-4 animate-pulse text-amber-500" />
              </div>
              
              <div className="h-4 w-px bg-neutral-200" />

              <div className="flex items-center gap-1">
                {/* Bold */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleApplyBold(); }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer"
                  title="Make Selected Text Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>

                {/* Italic */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleApplyItalic(); }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer"
                  title="Make Selected Text Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-neutral-100 mx-1" />

                {/* Align Left */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('left'); }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>

                {/* Align Center */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('center'); }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>

                {/* Align Right */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('right'); }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-neutral-100 mx-1" />

                {/* Reset format */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleResetNormalFormatting(); }}
                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 transition flex items-center justify-center cursor-pointer"
                  title="Reset Formatting"
                >
                  <RemoveFormatting className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-neutral-100 mx-1" />

                {/* Kite Find & Replace button */}
                <button
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    setIsFindReplaceOpen(true); 
                  }}
                  className={`p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer ${
                    isFindReplaceOpen 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Find and Replace Words in Script"
                >
                  <Kite className="w-4 h-4" />
                </button>
              </div>

              <div className="h-4 w-px bg-neutral-200" />

              {/* Dismiss button */}
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="ml-auto p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Dismiss overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Backdrop Overlay (Mobile-Only) */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs z-30 md:hidden cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Nav and shortcuts Sidebar board with smooth transition drawer */}
            <div className={`
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:flex'}
              transition-transform duration-300 ease-in-out
              fixed inset-y-0 left-0 z-40 w-64 md:static flex-shrink-0 h-full flex
            `}>
              <Sidebar
                scenes={activeScenes}
                currentSceneIndex={focusedLineIdx}
                onJumpToScene={(idx) => {
                  handleJumpToScene(idx);
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                wordCount={getWordCount(activeScript!, true)}
                pagesCount={getPagesCount(activeScript!, true)}
                onCloseMobile={() => setIsSidebarOpen(false)}
              />
            </div>

            {/* Sidebar trigger switch pin button */}
            <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="fixed sm:absolute bottom-6 left-6 z-30 p-3 bg-white text-[#5d8f25] hover:bg-neutral-100 border border-neutral-300 rounded-full shadow-2xl active:scale-95 transition cursor-pointer flex items-center justify-center font-bold"
               title="Toggle Screenplay Navigator"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Main scroll editor workspace */}
            <main className="flex-1 overflow-y-auto bg-[#FAF9F6] flex justify-center p-3 sm:p-6 select-text relative">
              
              {/* Paper scaling board wrapping layer */}
              <div 
                className="w-full max-w-[850px] flex flex-col items-center transition-all origin-top pb-24 pr-12"
                style={{
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : 'none',
                  paddingLeft: zoomLevel < 100 ? `${(100 - zoomLevel) / 2}%` : '0',
                  paddingRight: zoomLevel < 100 ? `${(100 - zoomLevel) / 2 + 3}%` : '12px',
                }}
              >
                {/* Meta details config badge block inside the main canvas */}
                <div className="mb-6 w-full max-w-[650px] bg-white border border-neutral-200 p-4 rounded-xl flex items-center justify-between select-none shadow-md shadow-[#97cc5b]/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#97cc5b]/10 rounded-lg text-[#5d8f25]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase block">{activeScript?.title || 'Screenplay Details'}</h4>
                      <p className="text-[10px] text-neutral-500 block">Configure cover page metadata, writers, contact, spec notes.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setModalMode('edit');
                        setModalInitialData(activeScript || undefined);
                        setIsModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-md text-[11px] font-bold text-neutral-800 transition"
                    >
                      Configure Metadata
                    </button>
                    <button
                      onClick={() => setShowCoverPage(!showCoverPage)}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                        showCoverPage ? 'bg-[#97cc5b]/10 text-[#5d8f25] border border-neutral-200' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-805 border border-neutral-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showCoverPage ? 'Cover Page On' : 'Cover Page Off'}</span>
                    </button>
                  </div>
                </div>

                {/* Simulated mechanical standard typewriter paper wrapper */}
                <div className="w-full max-w-[650px] flex flex-col shadow-2xl rounded bg-white">
                  
                  {/* Dynamic cover page rendering */}
                  {showCoverPage && activeScript && (
                    <div className="w-full min-h-[840px] bg-white border-b-2 border-dashed border-neutral-200 text-neutral-900 font-courier p-16 sm:p-20 relative flex flex-col justify-between select-text selection:bg-neutral-100 uppercase-fields">
                      
                      {/* Blank ceiling spacing */}
                      <div className="h-10" />

                      {/* Screenplay Title heading block */}
                      <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-widest text-black underline mb-6">
                          {activeScript.title?.toUpperCase() || 'UNTITLED'}
                        </h1>
                        <p className="text-sm font-normal text-neutral-600 mt-2 lowercase italic tracking-tight capitalize select-none block">written by</p>
                        <h2 className="text-base font-bold text-black tracking-wide mt-2">
                          {activeScript.writer || 'Unknown Screenwriter'}
                        </h2>
                      </div>

                      {/* Contact metadata bottom section */}
                      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 mt-auto text-xs leading-relaxed text-black/85">
                        <div className="text-left font-normal max-w-xs capitalize font-courier whitespace-pre-line pl-2 border-l-2 border-neutral-200">
                          {activeScript.address || 'Draft Submission Only'}
                        </div>
                        <div className="text-right flex flex-col font-courier pr-2 font-normal">
                          {activeScript.email && <span className="lowercase">{activeScript.email}</span>}
                          {activeScript.phone && <span>{activeScript.phone}</span>}
                          {activeScript.notes && <span className="italic text-[11px] text-neutral-500 lowercase first-letter:capitalize font-courier mt-1">{activeScript.notes}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Script body mechanical drafting page paper */}
                  <div 
                    onClick={(e) => {
                      // Click blank margins refocuses boundary editing text cell ONLY when directly clicking paper background
                      if (e.target === e.currentTarget && lines.length > 0) {
                        focusLine(lines.length - 1, 'end');
                      }
                    }}
                    className="w-full min-h-[900px] bg-white text-neutral-900 font-courier p-14 sm:p-20 relative select-text selection:bg-neutral-100"
                  >
                    {(() => {
                      const sceneNumbers: Record<string, number> = {};
                      let sceneCounter = 0;
                      lines.forEach((l) => {
                        if (l.format === 'scene-heading') {
                          sceneCounter++;
                          sceneNumbers[l.id] = sceneCounter;
                        }
                      });

                      return lines.map((line, idx) => (
                        <LineItem
                          key={line.id}
                          line={line}
                          index={idx}
                          isActive={focusedLineIdx === idx}
                          onFocus={setFocusedLineIdx}
                          onChange={handleLineTextChange}
                          onKeyDown={handleLineKeyDown}
                          zoomLevel={zoomLevel}
                          sceneNumber={sceneNumbers[line.id]}
                        />
                      ));
                    })()}

                    {/* Absolute footer page page counts */}
                    <div className="absolute bottom-6 right-10 text-xs font-mono text-neutral-450 tracking-wide select-none">
                      Page {getPagesCount(activeScript!, true)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Vertical Formatting Toolbar on the Right side of the window */}
              <div 
                className={`fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 bg-white border border-neutral-200 p-2 rounded-2xl flex flex-col items-center gap-2 shadow-xl shadow-[#97cc5b]/5 max-h-[82vh] overflow-y-auto overflow-x-hidden w-14 shrink-0 select-none transition-all duration-300 ease-in-out ${
                  isScriptRightFormattingOpen 
                    ? 'translate-x-0 opacity-100 pointer-events-auto shadow-2xl scale-100' 
                    : 'translate-x-[200%] opacity-0 pointer-events-none scale-95'
                }`}
                title="Format Selection Sidebar"
              >
                {formattingOptions.map(opt => {
                  const isActive = currentSelectionFormat === opt.format;
                  return (
                    <button
                      key={opt.format}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Stop from stealing editor focus!
                        handleApplyFormat(opt.format);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 ${
                        isActive 
                          ? 'bg-[#97cc5b] text-[#1a2410] shadow-md shadow-[#97cc5b]/25 font-bold border border-[#97cc5b]' 
                          : 'text-neutral-500 hover:text-[#5d8f25] hover:bg-[#FAF9F6] border border-transparent'
                      }`}
                      title={`${opt.label} (${opt.shortcut})`}
                    >
                      {opt.icon}
                    </button>
                  );
                })}

                <div className="w-6 h-px bg-neutral-200 my-0.5 shrink-0" />

                {/* Puzzle piece plugin extension button */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsExtensionModalOpen(!isExtensionModalOpen);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border active:scale-95 shrink-0 ${
                    isExtensionModalOpen
                      ? 'bg-amber-100 text-amber-600 border-amber-200'
                      : 'text-neutral-400 hover:text-amber-500 hover:bg-[#FAF9F6] border-transparent'
                  }`}
                  title="Text Formatting Overlay"
                >
                  <Puzzle className="w-4 h-4" />
                </button>
              </div>
            </main>
          </div>
        </div>
      ) : (
        // ============================================
        // IDEAS NOTE EDITOR WORKSPACE
        // ============================================
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] relative">
           {/* Main Top bar toolbar component for Idea Note */}
          <header className="border-b border-neutral-200 bg-white sticky top-0 backdrop-blur-md z-30 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
              
              {/* Back & Breadcrumb info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseNoteEditor}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Return to Portfolio"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-bold sm:inline hidden">Portfolio</span>
                </button>
                <div className="h-4 w-px bg-neutral-200" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-[#5d8f25] flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Ideas Note
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Note tools - Bold, Italic, formatting, align, delete */}
              <div className="flex items-center gap-1.5 flex-wrap">
                
                {/* Collapsible Sidebar Toggle Trigger button (Icon Only) */}
                {noteEditMode === 'edit' && (
                  <button
                    onClick={() => setIsNoteSidebarOpen(!isNoteSidebarOpen)}
                    className={`p-2 rounded-lg border transition duration-150 flex items-center justify-center cursor-pointer ${
                      isNoteSidebarOpen
                        ? 'bg-[#97cc5b]/15 text-[#5d8f25] border-neutral-300'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
                    }`}
                    title={isNoteSidebarOpen ? "Hide Formatting Sidebar" : "Show Formatting Sidebar"}
                  >
                    <Pen className="w-4 h-4" />
                  </button>
                )}

                {/* Configuration metadata note trigger */}
                <button
                  onClick={() => {
                    setNoteModalMode('edit');
                    setNoteModalInitialData(activeNote || undefined);
                    setIsNoteModalOpen(true);
                  }}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 border border-transparent hover:border-neutral-200 transition cursor-pointer"
                  title="Configure Note Details"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* PDF export (Icon Only) */}
                <button
                  onClick={() => handleExportNotePDF()}
                  className="p-2 hover:bg-[#97cc5b]/10 hover:text-[#5d8f25] rounded-lg text-neutral-600 transition bg-neutral-50 hover:border-[#cee7aa] border border-neutral-200 flex items-center justify-center active:scale-95 cursor-pointer"
                  title="Export Note to PDF"
                >
                  <Download className="w-4 h-4 text-neutral-600" />
                </button>

                {/* Save button (Saves work, keeps user inside editor) */}
                <button
                  onClick={handleManualSaveNote}
                  className="p-2 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 font-bold rounded-lg transition active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Save Note Progress"
                >
                  <Save className="w-4 h-4 text-neutral-950" />
                </button>
              </div>

            </div>
          </header>

          {/* Editor Workspace flex wrapper for sidebar + main */}
          <div className="flex-1 flex min-h-0 relative">
            
            {/* Slim Floating Formatting Sidebar (Icons Only) - Stay sticky on screen by placing outside of the scrolling main element! */}
            {noteEditMode === 'edit' && (
              <div 
                className={`absolute top-4 z-40 bg-white/95 backdrop-blur-md border border-neutral-200 p-1.5 rounded-full shadow-lg flex flex-col items-center gap-1.5 w-11 shrink-0 transition-all duration-300 ease-in-out select-none ${
                  isNoteSidebarOpen 
                    ? 'left-4 opacity-100 scale-100 pointer-events-auto shadow-xl' 
                    : '-left-16 opacity-0 scale-95 pointer-events-none'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bold */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleApplyBold(); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title="Bold Selected"
                >
                  <Bold className="w-4 h-4" />
                </button>
                
                {/* Italic */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleApplyItalic(); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title="Italic Selected"
                >
                  <Italic className="w-4 h-4" />
                </button>

                <div className="w-5 h-px bg-neutral-200 my-0.5" />

                {/* Left alignment */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('left'); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>

                {/* Center alignment */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('center'); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>

                {/* Right alignment */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleChangeAlignment('right'); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                <div className="w-5 h-px bg-neutral-200 my-0.5" />

                {/* Reset format */}
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleResetNormalFormatting(); }}
                  className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 rounded-full text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  title="Clear formatting"
                >
                  <RemoveFormatting className="w-4 h-4" />
                </button>

                <div className="w-5 h-px bg-neutral-200 my-0.5" />

                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title={`Zoom Out (${zoomLevel}%)`}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Zoom display */}
                <span className="text-[9px] font-mono font-bold text-neutral-500 select-none">
                  {zoomLevel}%
                </span>

                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                  title={`Zoom In (${zoomLevel}%)`}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Floating Mode Switch button - outside scrolling element to remain stationary */}
            <button
              onClick={() => setNoteEditMode(noteEditMode === 'edit' ? 'read' : 'edit')}
              className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 rounded-full shadow-lg flex items-center justify-center border border-neutral-300 active:scale-95 transition cursor-pointer"
              title={noteEditMode === 'edit' ? 'Switch to Reading Mode' : 'Switch to Editing Mode'}
            >
              {noteEditMode === 'read' ? <BookOpen className="w-5 h-5 text-neutral-955" /> : <Eye className="w-5 h-5 text-neutral-955" />}
            </button>

            {/* Subtle corner Auto-save notification badge */}
            <div className="fixed bottom-6 left-6 z-40 pointer-events-none transition-all duration-300">
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 text-[10px] font-bold text-neutral-200 rounded-full shadow-lg backdrop-blur-md border border-neutral-800 animate-pulse animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/80 text-[10px] font-semibold text-neutral-300 rounded-full shadow-lg backdrop-blur-md border border-neutral-800 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#97cc5b]" />
                  <span>Draft Saved</span>
                </div>
              )}
            </div>

            <main className="flex-1 overflow-y-auto bg-[#FAF9F6] flex justify-center p-4 sm:p-8 select-text relative">
              
              {/* Note paper sheet wrapping layer */}
              <div 
                className="w-full max-w-[850px] flex flex-col items-center transition-all origin-top pb-24"
                style={{
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : 'none',
                  transformOrigin: 'top center'
                }}
              >
                
                {/* Optional brief details metadata overlay panel inside paper */}
                <div className="mb-5 w-full max-w-[700px] bg-white border border-neutral-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase block truncate">{activeNote?.title || 'Raw Planning Notes'}</h4>
                    <p className="text-[11px] text-neutral-500 block mt-1">
                      {activeNote?.description || 'Freeform creative sandbox. Supports rich formatting highlights, alignments, auto-saving, and PDF generation.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-[#5d8f25]">
                    <Clock className="w-3 h-3 text-[#5d8f25]" />
                    <span>Last edited {activeNote && formatDateStr(activeNote.updatedAt)}</span>
                  </div>
                </div>

                {/* Freeform Typing standard white Paper */}
                <div 
                  className="w-full max-w-[700px] min-h-[840px] bg-white rounded-lg shadow-2xl p-12 sm:p-16 text-neutral-800 transition-all border border-neutral-200"
                >
                  {noteEditMode === 'edit' ? (
                    <FreeformNoteEditor
                      noteId={currentNoteId || ''}
                      initialContent={activeNote?.content || ''}
                      readOnly={false}
                    />
                  ) : (
                    <div 
                      className="w-full h-full min-h-[700px] text-sm leading-relaxed font-sans text-left select-text prose"
                      dangerouslySetInnerHTML={{ __html: activeNote?.content || '' }}
                    />
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Simbi Document (.simbidoc) Sharing Modal */}
      {isShareModalOpen && sharingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs select-none animate-fade-in">
          <div 
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col text-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="text-sm font-black text-neutral-700 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#5d8f25]" />
                <span>Share Simbi Document (.simbidoc)</span>
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-800 rounded-md transition text-neutral-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-left">
              
              {/* Document Icon & Title Panel */}
              <div className="flex flex-col items-center justify-center p-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                <img 
                  src="/src/assets/images/simbidoc_icon_1781194858674.jpg" 
                  alt=".simbidoc format icon" 
                  className="w-24 h-24 object-contain rounded-xl shadow-md border border-neutral-200 bg-white p-1"
                  referrerPolicy="no-referrer"
                />
                <h4 className="text-sm font-bold text-neutral-800 mt-3 text-center truncate w-full px-4">
                  {sharingItem.title || 'Untitled'}
                </h4>
                <p className="text-[10px] text-neutral-400 font-mono mt-1">
                  {sharingType === 'script' ? 'SCREENPLAY ELEMENT' : 'WORK PLANNING NOTE'}
                </p>
              </div>

              {/* Informative description text about .simbidoc format */}
              <div className="text-[11px] text-neutral-500 leading-relaxed bg-[#cee7aa]/10 p-3.5 rounded-xl border border-[#97cc5b]/20 space-y-1.5">
                <p className="font-bold text-[#5d8f25] flex items-center gap-1">
                  <span>✨</span>
                  <span>About .simbidoc Exclusivity:</span>
                </p>
                <p>
                  Saving or sharing files as <strong>.simbidoc</strong> preserves all interactive screenplay lines, character directions, and custom notes perfectly intact.
                </p>
                <p>
                  Any recipient can easily import this file via standard <strong>Import</strong> button on their own device to continue editing seamlessly.
                </p>
              </div>

              {/* Elegant primary download button for SimbiDoc file */}
              <button
                onClick={() => {
                  const docTitle = sharingItem.title || 'Untitled';
                  const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.simbidoc`;
                  const simbiDocContent = {
                    simbiSign: "SIMBI_DOCUMENT_v1",
                    docType: sharingType,
                    payload: sharingItem
                  };
                  triggerFileDownload(JSON.stringify(simbiDocContent, null, 2), filename);
                  showToast('Editable .simbidoc file saved to your device!', 'success');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 rounded-xl text-xs font-black shadow-md transition cursor-pointer border border-[#cee7aa] active:scale-95 duration-100"
              >
                <Upload className="w-4 h-4 rotate-180" />
                <span>Download Editable .simbidoc File</span>
              </button>

            </div>

            {/* Footer with close button */}
            <div className="flex items-center justify-end p-4 bg-neutral-50 border-t border-neutral-100 gap-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Script configuration/creation detail modal element */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModalData}
        initialData={modalInitialData}
        mode={modalMode}
      />

      {/* Ideas Note configuration/creation detail modal element */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNoteModalData}
        initialData={noteModalInitialData}
        mode={noteModalMode}
      />

      {/* Script Find & Replace Modal */}
      {isFindReplaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-400/30 backdrop-blur-xs select-none">
          <div 
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col text-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="text-sm font-black text-neutral-700 flex items-center gap-2">
                <Kite className="w-5 h-5 text-[#5d8f25]" />
                <span>Script Find & Replace</span>
              </h3>
              <button
                onClick={() => {
                  setIsFindReplaceOpen(false);
                  setIsExtensionModalOpen(false); // Dismisses Puzzle toolbar as well
                }}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-800 rounded-md transition text-neutral-400 cursor-pointer"
                title="Close modal and hide Puzzle toolbar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-left">
              
              {/* Instructions text (Well-stated, greyed out but clear) */}
              <div className="text-[11px] text-neutral-400 leading-relaxed space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <p className="font-bold text-neutral-500">How to use global find & replace:</p>
                <p>1. Enter the word to search (e.g. <span className="font-mono text-neutral-600">Andrew</span>). Both uppercase and lowercase versions will be found automatically.</p>
                <p>2. Click <span className="font-semibold text-[#5d8f25]">Find</span> to count the occurrences across all screenplay elements.</p>
                <p>3. Enter your replacement word (e.g. <span className="font-mono text-neutral-600">Philip</span>) and click <span className="font-semibold text-amber-600">Replace All</span> to complete the conversion instantly.</p>
              </div>

              {/* Find word input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block">
                  Find Word
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Andrew"
                    value={findQuery}
                    onChange={(e) => {
                      setFindQuery(e.target.value);
                      setFindMatchesCount(null); // Reset count on input change
                    }}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none text-neutral-800 focus:border-[#97cc5b] transition"
                  />
                  <button
                    onClick={handleFindText}
                    className="px-3.5 py-2 bg-[#97cc5b]/10 hover:bg-[#97cc5b]/20 text-[#5d8f25] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Find
                  </button>
                </div>
              </div>

              {/* Matches display */}
              {findMatchesCount !== null && (
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between text-xs animate-slide-up">
                  <span className="text-neutral-500 font-medium">Total occurrences:</span>
                  <span className="font-black text-[#5d8f25] text-sm bg-white border border-neutral-100 px-2 py-0.5 rounded shadow-sm">
                    {findMatchesCount} match{findMatchesCount === 1 ? '' : 'es'}
                  </span>
                </div>
              )}

              {/* Replace word input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block">
                  Replace With
                </label>
                <input
                  type="text"
                  placeholder="e.g. Philip"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none text-neutral-800 focus:border-[#97cc5b] transition"
                  disabled={findMatchesCount === null}
                />
                {findMatchesCount === null && (
                  <p className="text-[9px] text-neutral-400 italic">
                    Find matches first to enable replacing.
                  </p>
                )}
              </div>

            </div>

            {/* Footer containing Cancel & Close Toolbar buttons */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 border-t border-neutral-100 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFindQuery('');
                  setReplaceQuery('');
                  setFindMatchesCount(null);
                  setIsFindReplaceOpen(false);
                  setIsExtensionModalOpen(false); // Dismisses Puzzle toolbar as well
                }}
                className="px-3 py-2 border border-neutral-200 hover:bg-white text-neutral-600 bg-neutral-100 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Dismiss modal and close formatting tool"
              >
                Close & Hide Toolbar
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFindQuery('');
                    setReplaceQuery('');
                    setFindMatchesCount(null);
                    setIsFindReplaceOpen(false);
                  }}
                  className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplaceText}
                  disabled={findMatchesCount === null || findMatchesCount === 0 || !findQuery.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
                    findMatchesCount === null || findMatchesCount === 0 || !findQuery.trim()
                      ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none'
                      : 'bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 border border-[#cee7aa]'
                  }`}
                >
                  Replace All
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modern Workspace Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in select-none">
          <div 
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col text-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header block */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#5d8f25]" />
              <input
                autoFocus
                type="text"
                placeholder="Search dialogue, descriptions, headings, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm outline-none placeholder-neutral-400 text-neutral-800 p-1"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="p-1.5 hover:bg-neutral-200/50 rounded-lg text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                title="Cancel search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin divide-y divide-neutral-100">
              {searchQuery.trim() === '' ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <Search className="w-8 h-8 text-neutral-300 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-bold text-neutral-400">Search Workspace</span>
                  <span className="text-[11px] text-neutral-400 max-w-xs mt-1 text-center leading-relaxed">
                    Type a query above to start searching titles, writers, notes, and internal draft content...
                  </span>
                </div>
              ) : (
                (() => {
                  const matches = [];
                  const q = searchQuery.trim().toLowerCase();
                  
                  // Search standard scripts (screenplay content format)
                  scripts.forEach(script => {
                    let matched = false;
                    let matchReason = '';
                    
                    if (script.title.toLowerCase().includes(q)) {
                      matched = true;
                      matchReason = 'Title Match';
                    } else if (script.writer && script.writer.toLowerCase().includes(q)) {
                      matched = true;
                      matchReason = `Writer Match: "${script.writer}"`;
                    } else if (script.notes && script.notes.toLowerCase().includes(q)) {
                      matched = true;
                      matchReason = `Notes Match`;
                    } else if (script.content && script.content.some(l => l.text && l.text.toLowerCase().includes(q))) {
                      matched = true;
                      const firstMatch = script.content.find(l => l.text && l.text.toLowerCase().includes(q));
                      matchReason = `Text snippet: "${firstMatch?.text.substring(0, 40)}..."`;
                    }

                    if (matched) {
                      matches.push({
                        id: script.id,
                        title: script.title,
                        type: 'script' as const,
                        reason: matchReason,
                        updatedAt: script.updatedAt,
                        subtext: `${script.writer || 'Unknown Writer'} • ${script.content?.length || 0} formatted lines`
                      });
                    }
                  });

                  // Search customized workspace idea notes
                  notes.forEach(note => {
                    let matched = false;
                    let matchReason = '';

                    if (note.title.toLowerCase().includes(q)) {
                      matched = true;
                      matchReason = 'Title Match';
                    } else if (note.description && note.description.toLowerCase().includes(q)) {
                      matched = true;
                      matchReason = `Description Match: "${note.description}"`;
                    } else if (note.content && note.content.toLowerCase().includes(q)) {
                      matched = true;
                      const plainTextOnly = note.content.replace(/<[^>]*>/g, '');
                      const matchIndex = plainTextOnly.toLowerCase().indexOf(q);
                      const snippet = plainTextOnly.substring(Math.max(0, matchIndex - 10), Math.min(plainTextOnly.length, matchIndex + 40));
                      matchReason = `Content: "...${snippet}..."`;
                    }

                    if (matched) {
                      matches.push({
                        id: note.id,
                        title: note.title,
                        type: 'note' as const,
                        reason: matchReason,
                        updatedAt: note.updatedAt,
                        subtext: note.description ? note.description : 'Idea Note'
                      });
                    }
                  });

                  // Handle case when search query produces 0 matched scripts or notes
                  if (matches.length === 0) {
                    return (
                      <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                        <span className="text-2xl mb-2">🔍</span>
                        <span className="text-xs font-bold text-neutral-500">Document not found</span>
                        <span className="text-[10px] text-neutral-400 mt-1 max-w-xs leading-relaxed">
                          We searched through your screenplay details, writer credits, lines, and logs, but didn't find any match.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                        Found {matches.length} matching document{matches.length === 1 ? '' : 's'}
                      </div>
                      {matches.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSearchResult(item.id, item.type)}
                          className="w-full text-left p-3 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl transition cursor-pointer flex items-center justify-between group border border-transparent hover:border-neutral-100"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${
                                item.type === 'script' 
                                  ? 'bg-[#97cc5b]/10 text-[#5d8f25] border-[#cee7aa]' 
                                  : 'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {item.type === 'script' ? 'screenplay' : 'idea note'}
                              </span>
                              <span className="text-xs font-bold text-neutral-800 group-hover:text-[#5d8f25] transition-colors">
                                {item.title || 'Untitled Draft'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {item.subtext}
                            </div>
                            <div className="text-[10px] text-[#5d8f25] font-semibold italic">
                              {item.reason}
                            </div>
                          </div>
                          <div className="text-right text-[10px] text-neutral-400">
                            Updated {new Date(item.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer containing Cancel button */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 flex items-center justify-between">
              <span>Tip: Typings are automatically converted to lowercase.</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="px-3 py-1.5 border border-neutral-200 hover:bg-white text-neutral-700 bg-neutral-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in select-none">
          <div 
            className="bg-white border border-neutral-200 rounded-xl w-full max-w-md shadow-2xl flex flex-col text-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Confirm Permanent Deletion</span>
              </h3>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="p-1 hover:bg-neutral-100 hover:text-neutral-800 rounded-md transition text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3">
              <p className="text-xs text-neutral-600 leading-relaxed text-left">
                Are you sure you want to permanently delete this {deleteConfirmation.type === 'script' ? 'script' : 'idea note'}:
              </p>
              <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 font-mono text-xs text-neutral-800 break-all text-left">
                {deleteConfirmation.title || 'Untitled Draft'}
              </div>
              <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1.5 text-left">
                <span>⚠️ This action cannot be undone.</span>
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 bg-neutral-50 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 rounded-lg text-xs font-bold shadow-md shadow-[#97cc5b]/10 transition cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
