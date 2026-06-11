/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Script, IdeaNote } from '../types';

const SAMPLE_SCRIPT: Script = {
  id: 'sample_cyber_dawn',
  title: 'Cyber Dawn',
  writer: 'Cassandra Sterling',
  email: 'cassandra@sterlingfx.com',
  phone: '+1 (555) 019-2831',
  address: '102 Pine Street\nLos Angeles, CA 90028',
  notes: 'First draft. A speculative sci-fi thriller.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  content: [
    { id: '1', format: 'scene-heading', text: 'INT. STERLING LABS - NIGHT' },
    { id: '2', format: 'action', text: 'Flashing amber server lights paint the concrete bunker in deep crimson. A low hum vibrates the glass partition.' },
    { id: '3', format: 'character', text: 'LEO' },
    { id: '4', format: 'parenthetical', text: 'staring at a cascade of green code' },
    { id: '5', format: 'dialogue', text: 'It\'s repeating. Over and over again. Every line is an invitation.' },
    { id: '6', format: 'character', text: 'SARA' },
    { id: '7', format: 'dialogue', text: 'Don\'t run the compiler. We don\'t know how it behaves in isolated sandboxes.' },
    { id: '8', format: 'character', text: 'LEO' },
    { id: '9', format: 'parenthetical', text: 'smiles, hand hovering over key' },
    { id: '10', format: 'dialogue', text: 'That\'s the beauty of it. It doesn\'t want to be isolated.' },
    { id: '11', format: 'transition', text: 'CUT TO:' },
    { id: '12', format: 'scene-heading', text: 'EXT. LOS ANGELES STREET - DEEPER NIGHT' },
    { id: '13', format: 'action', text: 'Neon billboards flicker against the overcast sky. Rain begins to pepper the black asphalt.' },
    { id: '14', format: 'shot', text: 'WIDE ANCHOR SHOT - THE MAIN DATACENTER' },
    { id: '15', format: 'action', text: 'A single backup generator begins to sputter as all the city lights below start to slowly wind down in sequence.' }
  ]
};

export const Storage = {
  getScripts(): Script[] {
    try {
      const stored = localStorage.getItem('screenwriter_scripts');
      if (!stored) {
        // Initialize with sample script
        const scripts = [SAMPLE_SCRIPT];
        localStorage.setItem('screenwriter_scripts', JSON.stringify(scripts));
        return scripts;
      }
      return JSON.parse(stored);
    } catch {
      return [SAMPLE_SCRIPT];
    }
  },

  getScript(id: string): Script | null {
    const scripts = this.getScripts();
    return scripts.find((s) => s.id === id) || null;
  },

  saveScript(script: Script): void {
    const scripts = this.getScripts();
    const idx = scripts.findIndex((s) => s.id === script.id);
    const updatedScript = {
      ...script,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      scripts[idx] = updatedScript;
    } else {
      scripts.unshift(updatedScript);
    }
    localStorage.setItem('screenwriter_scripts', JSON.stringify(scripts));
  },

  deleteScript(id: string): void {
    const scripts = this.getScripts().filter((s) => s.id !== id);
    localStorage.setItem('screenwriter_scripts', JSON.stringify(scripts));
  },

  getNotes(): IdeaNote[] {
    try {
      const stored = localStorage.getItem('screenwriter_notes');
      if (!stored) {
        const sampleNote: IdeaNote = {
          id: 'sample_idea_noir',
          title: 'Sci-Fi Setting Brainstorm',
          description: 'Initial worldbuilding parameters and character arcs.',
          content: '<h2><strong>The World of Cyber Dawn</strong></h2><p>Here are the core atmospheric parameters for the world of Cyber Dawn:</p><ul><li><strong>Setting:</strong> Outpost Omega, a neon-lit rain-slicked metropolis covered by an artificial climate dome.</li><li><strong>Visual Theme:</strong> Retro-futuristic brutalist towers paired with vibrant analog cathode screens and copper wiring.</li><li><strong>Leo\'s Motivation:</strong> Leo believes the code is sentient. His obsession is to decrypt the repeating block.</li><li><strong>Sara\'s Conflict:</strong> Sara is haunted by a previous sandbox incident that crashed an entire sector\'s grid.</li></ul>',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const notes = [sampleNote];
        localStorage.setItem('screenwriter_notes', JSON.stringify(notes));
        return notes;
      }
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getNote(id: string): IdeaNote | null {
    const notes = this.getNotes();
    return notes.find((n) => n.id === id) || null;
  },

  saveNote(note: IdeaNote): void {
    const notes = this.getNotes();
    const idx = notes.findIndex((n) => n.id === note.id);
    const updatedNote = {
      ...note,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      notes[idx] = updatedNote;
    } else {
      notes.unshift(updatedNote);
    }
    localStorage.setItem('screenwriter_notes', JSON.stringify(notes));
  },

  deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    localStorage.setItem('screenwriter_notes', JSON.stringify(notes));
  }
};
