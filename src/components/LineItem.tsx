/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { ScreenplayLine } from '../types';

interface LineItemProps {
  line: ScreenplayLine;
  index: number;
  isActive: boolean;
  onFocus: (index: number) => void;
  onChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, index: number) => void;
  zoomLevel: number;
  sceneNumber?: number;
}

export const LineItem: React.FC<LineItemProps> = ({
  line,
  index,
  isActive,
  onFocus,
  onChange,
  onKeyDown,
  zoomLevel,
  sceneNumber,
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Sync state text back to DOM ONLY when it differs from the DOM's actual HTML content
  // and we're not actively typing, ensuring we prevent cursor jumps and backwards typing conflicts.
  useEffect(() => {
    if (elementRef.current) {
      const isFocused = document.activeElement === elementRef.current;
      const currentHtml = elementRef.current.innerHTML;

      // Calculate shouldSync using length of plain texts inside HTML to ensure non-invasive syncing
      const statePlainLength = (line.text || '').replace(/<[^>]*>/g, '').length;
      const domPlainLength = currentHtml.replace(/<[^>]*>/g, '').length;
      const shouldSync = !isFocused || (currentHtml !== line.text && Math.abs(domPlainLength - statePlainLength) > 1);

      if (shouldSync && currentHtml !== line.text) {
        elementRef.current.innerHTML = line.text || '';

        // Reset cursor to end if programmatic update occurs while focused (e.g. apply format template)
        if (isFocused) {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(elementRef.current);
            range.collapse(false); // Collapse to end of content
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [line.text]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML || '';
    onChange(line.id, html);
  };

  return (
    <div className="relative group w-full">
      {line.format === 'scene-heading' && sceneNumber && (
        <span
          contentEditable={false}
          className="absolute left-[-2.0rem] sm:left-[-3.0rem] text-right w-6 sm:w-10 text-[#5d8f25] font-bold select-none text-[11pt] pointer-events-none"
          style={{ top: '1.5px' }}
        >
          {sceneNumber}.
        </span>
      )}
      <div
        ref={elementRef}
        id={`line-${line.id}`}
        contentEditable
        suppressContentEditableWarning
        className={`script-line ${line.format} ${isActive ? 'active-line' : ''}`}
        data-format={line.format}
        onFocus={() => onFocus(index)}
        onInput={handleInput}
        onKeyDown={(e) => onKeyDown(e, index)}
        onClick={(e) => e.stopPropagation()}
        style={{
          outline: 'none',
          position: 'relative',
          textAlign: line.align || undefined,
        }}
      />
    </div>
  );
};
