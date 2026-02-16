// Minecraft color code to CSS color mapping
const COLOR_CODES: Record<string, string> = {
  '0': '#000000', // Black
  '1': '#0000AA', // Dark Blue
  '2': '#00AA00', // Dark Green
  '3': '#00AAAA', // Dark Aqua
  '4': '#AA0000', // Dark Red
  '5': '#AA00AA', // Dark Purple
  '6': '#FFAA00', // Gold
  '7': '#AAAAAA', // Gray
  '8': '#555555', // Dark Gray
  '9': '#5555FF', // Blue
  'a': '#55FF55', // Green
  'b': '#55FFFF', // Aqua
  'c': '#FF5555', // Red
  'd': '#FF55FF', // Light Purple
  'e': '#FFFF55', // Yellow
  'f': '#FFFFFF', // White
};

const FORMAT_CODES: Record<string, string> = {
  'k': 'obfuscated', // Obfuscated (not commonly rendered)
  'l': 'font-weight: bold',
  'm': 'text-decoration: line-through',
  'n': 'text-decoration: underline',
  'o': 'font-style: italic',
  'r': 'reset', // Reset all formatting
};

export interface MotdSegment {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
}

/**
 * Parse MOTD with Minecraft color codes into styled segments
 */
export function parseMotd(motd: string): MotdSegment[] {
  const segments: MotdSegment[] = [];
  let currentSegment: MotdSegment = { text: '' };
  let i = 0;

  while (i < motd.length) {
    // Check for § color code
    if (motd[i] === '§' && i + 1 < motd.length) {
      // Save current segment if it has text
      if (currentSegment.text) {
        segments.push({ ...currentSegment });
        currentSegment = {
          text: '',
          color: currentSegment.color,
          bold: currentSegment.bold,
          italic: currentSegment.italic,
          underline: currentSegment.underline,
          strikethrough: currentSegment.strikethrough,
        };
      }

      const code = motd[i + 1].toLowerCase();

      if (COLOR_CODES[code]) {
        // Color code - reset formatting but keep the color
        currentSegment = {
          text: '',
          color: COLOR_CODES[code],
        };
      } else if (code === 'r') {
        // Reset all formatting
        currentSegment = { text: '' };
      } else if (code === 'l') {
        currentSegment.bold = true;
      } else if (code === 'o') {
        currentSegment.italic = true;
      } else if (code === 'n') {
        currentSegment.underline = true;
      } else if (code === 'm') {
        currentSegment.strikethrough = true;
      } else if (code === 'k') {
        currentSegment.obfuscated = true;
      }

      i += 2;
    } else {
      currentSegment.text += motd[i];
      i++;
    }
  }

  // Add final segment if it has text
  if (currentSegment.text) {
    segments.push(currentSegment);
  }

  return segments;
}

import type { CSSProperties } from 'react';

/**
 * Convert a segment to inline CSS style object
 */
export function segmentToStyle(segment: MotdSegment): CSSProperties {
  const style: CSSProperties = {};

  if (segment.color) {
    style.color = segment.color;
  }
  if (segment.bold) {
    style.fontWeight = 'bold';
  }
  if (segment.italic) {
    style.fontStyle = 'italic';
  }

  const textDecorations: string[] = [];
  if (segment.underline) {
    textDecorations.push('underline');
  }
  if (segment.strikethrough) {
    textDecorations.push('line-through');
  }
  if (textDecorations.length > 0) {
    style.textDecoration = textDecorations.join(' ');
  }

  return style;
}

/**
 * Strip all Minecraft formatting codes from text
 */
export function stripMotdCodes(motd: string): string {
  return motd.replace(/§[0-9a-fk-or]/gi, '');
}
