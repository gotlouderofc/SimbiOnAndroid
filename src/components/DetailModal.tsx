/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, FileText, User, Mail, Phone, MapPin, Calendar, CheckSquare } from 'lucide-react';
import { Script } from '../types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Script>) => void;
  initialData?: Partial<Script>;
  mode: 'create' | 'edit';
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    writer: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState({
    title: false,
    writer: false,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || '',
        writer: initialData?.writer || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        notes: initialData?.notes || '',
      });
      setErrors({ title: false, writer: false });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const titleErr = !formData.title.trim();
    const writerErr = !formData.writer.trim();

    if (titleErr || writerErr) {
      setErrors({
        title: titleErr,
        writer: writerErr,
      });
      return;
    }

    onSave({
      title: formData.title.trim(),
      writer: formData.writer.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {mode === 'create' ? 'Create New Screenplay' : 'Edit Screenplay Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 hover:text-white rounded-md transition text-neutral-450"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Screenplay Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. Inception"
                className={`w-full bg-neutral-950 border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition text-white ${
                  errors.title ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-800 focus:border-amber-500'
                }`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            {errors.title && <p className="text-[10px] text-rose-500 mt-1 font-semibold">Title is required.</p>}
          </div>

          {/* Writer */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Screenwriter Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. Christopher Nolan"
                className={`w-full bg-neutral-950 border rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none transition text-white ${
                  errors.writer ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-800 focus:border-amber-500'
                }`}
                value={formData.writer}
                onChange={(e) => setFormData({ ...formData, writer: e.target.value })}
              />
            </div>
            {errors.writer && <p className="text-[10px] text-rose-500 mt-1 font-semibold">Writer name is required.</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  placeholder="contact@nolan.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="+1 (555) 753-1592"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-white"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Postal/Studio Address (For Cover Page)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <textarea
                placeholder="e.g. Syncopy Inc.&#10;8100 Melrose Ave&#10;Los Angeles, CA 90046"
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-white resize-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Spec Draft Notes
            </label>
            <div className="relative">
              <textarea
                placeholder="e.g. First Draft. For agent review."
                rows={2}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-500 transition text-white resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-xs font-bold shadow-md shadow-amber-950/10 transition"
            >
              {mode === 'create' ? 'Create Screenplay' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
