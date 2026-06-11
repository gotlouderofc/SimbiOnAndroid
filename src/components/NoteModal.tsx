/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, FileText, AlignLeft } from 'lucide-react';
import { IdeaNote } from '../types';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
  initialData?: Partial<IdeaNote>;
  mode: 'create' | 'edit';
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setError(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(true);
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in select-none animate-duration-150">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#97cc5b]" />
            <span>{mode === 'create' ? 'New Ideas Note' : 'Edit Note Details'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 hover:text-white rounded-md transition text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Note Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. Act III Pitch & Scenes"
                className={`w-full bg-neutral-950 border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition text-white ${
                  error ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-800 focus:border-amber-500'
                }`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setError(false);
                }}
                autoFocus
              />
            </div>
            {error && <p className="text-[10px] text-rose-500 mt-1 font-semibold">Title is required.</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <textarea
                placeholder="A high-level overview or focus area for this set of brainstormed ideas..."
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-white resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-neutral-200 rounded-lg text-xs font-bold text-neutral-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#97cc5b] hover:bg-[#86b84f] text-neutral-950 rounded-lg text-xs font-bold shadow-md shadow-[#97cc5b]/10 transition"
            >
              {mode === 'create' ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
