/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Script, ScreenplayLine, IdeaNote } from '../types';

export const PDFExporter = {
  export(script: Script): void {
    // Standard Letter dimensions: 8.5" x 11" (612pt x 792pt)
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'portrait',
    });

    const pageWidth = 612;
    const pageHeight = 792;
    const marginLeft = 90; // 1.25" Left margin
    const marginRight = 90; // 1.25" Right margin
    const marginTop = 72; // 1" Top margin
    const marginBottom = 72; // 1" Bottom margin
    const contentWidth = pageWidth - marginLeft - marginRight;

    doc.setFont('courier', 'normal');

    let currentY = marginTop;
    let pageNum = 1;

    // Helper: Add page header / number
    const addPageNumber = (pNum: number) => {
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      // Screenplay standard: Page number is always at top-right (around 1" top, 1.25" right)
      doc.text(String(pNum), pageWidth - marginRight, 45, { align: 'right' });
    };

    // Helper: Check for page break
    const checkPageBreak = (neededHeight = 16) => {
      if (currentY + neededHeight > pageHeight - marginBottom) {
        doc.addPage();
        pageNum++;
        addPageNumber(pageNum);
        currentY = marginTop;
        return true;
      }
      return false;
    };

    // Helper: Warp text wrapped on Courier pitch
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      doc.setFontSize(fontSize);
      const words = text.split(/\s+/);
      const wrappedLines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const width = doc.getTextWidth(testLine);
        if (width > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
      return wrappedLines;
    };

    // ============================================
    // COVER PAGE
    // ============================================
    doc.setFontSize(22);
    doc.setFont('courier', 'bold');
    
    // Normalize and wrap title
    const titleLines = wrapText(script.title.toUpperCase(), contentWidth - 40, 22);
    const titleBlockHeight = titleLines.length * 30;
    
    // Center title vertically in the upper half
    let coverY = (pageHeight / 2) - (titleBlockHeight / 2) - 40;

    for (const line of titleLines) {
      doc.text(line, pageWidth / 2, coverY, { align: 'center' });
      const textWidth = doc.getTextWidth(line);
      // Underline title block
      doc.line(pageWidth / 2 - textWidth / 2, coverY + 4, pageWidth / 2 + textWidth / 2, coverY + 4);
      coverY += 30;
    }

    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    doc.text('written by', pageWidth / 2, coverY + 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text(script.writer, pageWidth / 2, coverY + 40, { align: 'center' });

    // Contact info bottom layout section:
    // Left bottom: Address (starts at pageHeight - 140)
    // Right bottom: Email, Phone, Notes (starts at pageHeight - 140)
    let bottomGroupY = pageHeight - 150;
    
    // Address (Left bottom)
    if (script.address) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      const addrLines = wrapText(script.address, contentWidth / 2 - 20, 10);
      let addrY = bottomGroupY;
      for (const line of addrLines) {
        doc.text(line, marginLeft, addrY);
        addrY += 14;
      }
    } else {
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text('Draft Submission Only', marginLeft, bottomGroupY);
    }

    // Email, Phone, Notes (Right bottom)
    let contactInfoY = bottomGroupY;
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');

    if (script.email) {
      doc.text(script.email.toLowerCase(), pageWidth - marginRight, contactInfoY, { align: 'right' });
      contactInfoY += 14;
    }
    if (script.phone) {
      doc.text(script.phone, pageWidth - marginRight, contactInfoY, { align: 'right' });
      contactInfoY += 14;
    }
    
    // Notes
    if (script.notes) {
      doc.setFont('courier', 'italic');
      doc.setFontSize(9);
      const noteLines = wrapText(script.notes, contentWidth / 2 - 20, 9);
      for (const line of noteLines) {
        doc.text(line, pageWidth - marginRight, contactInfoY, { align: 'right' });
        contactInfoY += 13;
      }
    }

    // Bottom creation date (Centered)
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    const dateStr = new Date(script.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    doc.text(dateStr, pageWidth / 2, pageHeight - 55, { align: 'center' });

    // ============================================
    // SCRIPT CONTENT (Page 2+)
    // ============================================
    doc.addPage();
    pageNum = 1; // Content starts at Page 1 (standard screenplay style hides page 1 number, but we'll show numbers for simplicity or standard script rules)
    addPageNumber(pageNum);
    
    currentY = marginTop;

    // Standard Screenplay Indentations (relative to letter dimensions)
    const margins = {
      'scene-heading': { left: marginLeft, width: contentWidth },
      'action': { left: marginLeft, width: contentWidth },
      'character': { left: marginLeft + 144, width: 220 },     // ~2.0" Indentation
      'parenthetical': { left: marginLeft + 108, width: 160 }, // ~1.5" Indentation
      'dialogue': { left: marginLeft + 72, width: 280 },       // ~1.0" Indentation
      'transition': { left: marginLeft, width: contentWidth },
      'shot': { left: marginLeft, width: contentWidth },
    };

    const fontSize = 12; // Standard screenplay is strictly 12pt Courier
    const pitchLineHeight = 16; // Standard 1/6 inch leading in points

    let sceneNum = 0;

    for (const line of script.content || []) {
      const format = line.format || 'action';
      if (format === 'scene-heading') {
        sceneNum++;
      }

      if (!line.text || line.text.trim() === '') {
        // Just empty carriage return spacing
        currentY += pitchLineHeight;
        checkPageBreak(pitchLineHeight);
        continue;
      }

      const margin = margins[format] || margins['action'];

      doc.setFontSize(fontSize);

      // Apply standard screenplay styles
      if (format === 'scene-heading') {
        doc.setFont('courier', 'bold');
      } else if (format === 'character') {
        doc.setFont('courier', 'bold');
      } else if (format === 'parenthetical') {
        doc.setFont('courier', 'italic');
      } else {
        doc.setFont('courier', 'normal');
      }

      // Strip HTML formatting codes (e.g. <b> or <i>) and retrieve clean text
      let textStr = (line.text || '').replace(/<[^>]*>/g, '').trim();

      if (format === 'scene-heading') {
        textStr = `${sceneNum}. ${textStr}`;
      }

      // Transform texts properly for print format
      if (format === 'scene-heading' || format === 'character' || format === 'transition' || format === 'shot') {
        textStr = textStr.toUpperCase();
      }

      if (format === 'parenthetical') {
        // Automatically make sure parentheticals are enclosed
        if (!textStr.startsWith('(')) {
          textStr = '(' + textStr;
        }
        if (!textStr.endsWith(')')) {
          textStr = textStr + ')';
        }
      }

      const wrappedLines = wrapText(textStr, margin.width, fontSize);

      for (const wrappedLine of wrappedLines) {
        checkPageBreak(pitchLineHeight);

        let xPos = margin.left;
        if (format === 'transition') {
          // Align transition to right margin edge
          const textWidth = doc.getTextWidth(wrappedLine);
          xPos = pageWidth - marginRight - textWidth;
        }

        doc.text(wrappedLine, xPos, currentY);
        currentY += pitchLineHeight;
      }

      // Add appropriate spaces below elements
      if (format === 'scene-heading') {
        currentY += pitchLineHeight; // Double space after scene header
      } else if (format === 'character') {
        // No space or minimal space before parenthetical/dialogue
      } else if (format === 'parenthetical') {
        // Tight spacing
      } else if (format === 'dialogue') {
        currentY += pitchLineHeight; // Standard double space after dialogue block
      } else if (format === 'action') {
        currentY += pitchLineHeight; // Standard double space after paragraph
      } else {
        currentY += pitchLineHeight;
      }
    }

    // Download file
    const safeTitle = script.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled_script';
    doc.save(`${safeTitle}_screenplay.pdf`);
  },

  exportNote(note: IdeaNote): void {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'portrait',
    });

    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 72; // 1" Margin
    const contentWidth = pageWidth - margin * 2;

    // Elegant Helvetica display headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);

    let currentY = 100;
    
    // Draw Title
    const titleLines = doc.splitTextToSize(note.title, contentWidth);
    for (const line of titleLines) {
      if (currentY + 30 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += 28;
    }

    currentY += 10;

    // Optional Note Description
    if (note.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(110, 110, 110);
      const descLines = doc.splitTextToSize(note.description, contentWidth);
      for (const line of descLines) {
        if (currentY + 20 > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += 18;
      }
      currentY += 15;
    }

    // Horizontal stylish divider line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 25;

    // Render body content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    // Turn HTML elements into plain lines with type cues
    let rawHtml = note.content || '';
    
    // Simple HTML preprocessing
    rawHtml = rawHtml.replace(/<\/h1>|<\/h2>|<\/h3>/gi, '\n\n[H]\n\n');
    rawHtml = rawHtml.replace(/<\/p>/gi, '\n\n');
    rawHtml = rawHtml.replace(/<\/li>/gi, '\n');
    rawHtml = rawHtml.replace(/<br\s*\/?>/gi, '\n');
    
    // Strip other tags
    const cleanText = rawHtml.replace(/<[^>]*>/g, '');
    
    // Split on paragraphs
    const paragraphs = cleanText.split('\n');
    
    let isHeader = false;
    for (let p of paragraphs) {
      p = p.trim();
      if (!p) continue;

      if (p === '[H]') {
        isHeader = true;
        continue;
      }

      const isBullet = p.startsWith('•') || p.startsWith('*');

      if (isHeader) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        const wrapped = doc.splitTextToSize(p, contentWidth);
        for (const line of wrapped) {
          if (currentY + 25 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY);
          currentY += 20;
        }
        currentY += 8;
        isHeader = false; // Reset
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(50, 50, 50);
        
        const indent = isBullet ? 15 : 0;
        const wrapped = doc.splitTextToSize(p, contentWidth - indent);
        for (const line of wrapped) {
          if (currentY + 20 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin + indent, currentY);
          currentY += 16;
        }
        currentY += 10;
      }
    }

    // Add running footer page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
    }

    const safeTitle = note.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled_notes';
    doc.save(`${safeTitle}_idea_notes.pdf`);
  }
};
