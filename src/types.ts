/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenplayFormat =
  | 'scene-heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'shot';

export interface ScreenplayLine {
  id: string;
  format: ScreenplayFormat;
  text: string;
  align?: 'left' | 'center' | 'right';
}

export interface IdeaNote {
  id: string;
  title: string;
  description?: string;
  content: string; // HTML format rich text content
  createdAt: string;
  updatedAt: string;
}

export interface Script {
  id: string;
  title: string;
  writer: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  content: ScreenplayLine[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
