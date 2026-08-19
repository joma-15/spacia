/**
 * Text-driven sizing math shared between the visual bubble
 * (AnswerBubble) and the spawn/positioning logic (spawnAnswer).
 *
 * Kept in ONE place on purpose: if the bubble visually grows
 * differently than the spawn logic assumes it will, spawn positions
 * that were "safe" on paper stop being safe on screen, and bubbles in
 * neighboring lanes can end up overlapping. Both files must always
 * agree on how big a label makes a bubble.
 */

export const MIN_FONT_SIZE = 11;
export const BASE_FONT_SIZE = 14;

/** The on-screen diameter a bubble will render at for a given label. */
export interface BubbleDimensions {
  width: number;
  height: number;
  fontSize: number;
  formattedLabel?: string;
}

/**
 * Checks if the text fits within a circle of a given diameter, accounting for padding.
 * Uses a geometric constraint: (textWidth/2)^2 + (textHeight/2)^2 <= (diameter/2 - padding)^2
 * equivalent to: textWidth^2 + textHeight^2 <= (diameter - 2 * padding)^2
 */
function canFitTextInCircle(
  label: string,
  fontSize: number,
  diameter: number,
  padding: number
): { fits: boolean; lines: string[]; textWidth: number; textHeight: number } {
  const charWidth = fontSize * 0.58;
  const lineHeight = fontSize * 1.35;
  const safeRadius = diameter / 2 - padding;

  if (safeRadius <= 0) return { fits: false, lines: [], textWidth: 0, textHeight: 0 };

  const words = label.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { fits: true, lines: [], textWidth: 0, textHeight: 0 };
  }

  let bestFit: { lines: string[]; textWidth: number; textHeight: number; diag: number } | null = null;

  // Search for the word-wrap configuration that yields the most compact bounding box
  for (let maxChars = 5; maxChars <= 40; maxChars++) {
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      if (currentLine.length === 0) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxChars) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    const L = lines.length;
    const H = L * lineHeight;
    if (H > safeRadius * 2) {
      continue;
    }

    let allLinesFit = true;
    let maxLineWidth = 0;

    for (let i = 0; i < L; i++) {
      const lineText = lines[i];
      const lineWidth = lineText.length * charWidth;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);

      // Check the corners of each line relative to the center (0, 0)
      const y1 = -H / 2 + i * lineHeight;
      const y2 = -H / 2 + (i + 1) * lineHeight;
      const yMax = Math.max(Math.abs(y1), Math.abs(y2));

      if (yMax >= safeRadius) {
        allLinesFit = false;
        break;
      }

      // Max width allowed at this height in a circle
      const allowedWidth = 2 * Math.sqrt(safeRadius * safeRadius - yMax * yMax);
      if (lineWidth > allowedWidth) {
        allLinesFit = false;
        break;
      }
    }

    if (allLinesFit) {
      const diag = maxLineWidth * maxLineWidth + H * H;
      if (!bestFit || diag < bestFit.diag) {
        bestFit = { lines, textWidth: maxLineWidth, textHeight: H, diag };
      }
    }
  }

  if (bestFit) {
    return {
      fits: true,
      lines: bestFit.lines,
      textWidth: bestFit.textWidth,
      textHeight: bestFit.textHeight,
    };
  }

  return { fits: false, lines: [], textWidth: 0, textHeight: 0 };
}

/** A conservative text measurement shared by spawning and rendering. */
export function getBubbleDimensions(label: string, playAreaWidth: number): BubbleDimensions {
  // Determine base and max diameter relative to play area width
  const baseDiameter = Math.max(115, Math.min(145, playAreaWidth * 0.33));
  const maxDiameter = Math.max(140, Math.min(185, playAreaWidth * 0.45));
  const padding = 12;

  let chosenDiameter = baseDiameter;
  let chosenFontSize = BASE_FONT_SIZE;
  let chosenLines: string[] = [label];
  let found = false;

  // Try to fit the text inside the baseDiameter by scaling font size from 14 down to 11
  for (const fs of [14, 13, 12, 11]) {
    const res = canFitTextInCircle(label, fs, baseDiameter, padding);
    if (res.fits) {
      chosenFontSize = fs;
      chosenDiameter = baseDiameter;
      chosenLines = res.lines;
      found = true;
      break;
    }
  }

  // If it doesn't fit in baseDiameter at font size 11, grow the diameter up to maxDiameter
  if (!found) {
    for (let d = baseDiameter + 5; d <= maxDiameter; d += 5) {
      const res = canFitTextInCircle(label, MIN_FONT_SIZE, d, padding);
      if (res.fits) {
        chosenFontSize = MIN_FONT_SIZE;
        chosenDiameter = d;
        chosenLines = res.lines;
        found = true;
        break;
      }
    }
  }

  // If it still doesn't fit, shrink font size to 10 and try growing diameter to maxDiameter
  if (!found) {
    for (let d = baseDiameter; d <= maxDiameter; d += 5) {
      const res = canFitTextInCircle(label, 10, d, 10);
      if (res.fits) {
        chosenFontSize = 10;
        chosenDiameter = d;
        chosenLines = res.lines;
        found = true;
        break;
      }
    }
  }

  // If it STILL doesn't fit (extremely long label/word), scale up diameter beyond maxDiameter (or cap at playAreaWidth)
  if (!found) {
    chosenFontSize = 10;
    let d = maxDiameter;
    // Cap at playAreaWidth - 20 to ensure it fits within boundaries comfortably
    const limit = Math.max(maxDiameter, playAreaWidth - 20);
    while (d < limit) {
      const res = canFitTextInCircle(label, 10, d, 8);
      if (res.fits) {
        chosenDiameter = d;
        chosenLines = res.lines;
        found = true;
        break;
      }
      d += 5;
    }
    if (!found) {
      // Fallback
      chosenDiameter = limit;
      const res = canFitTextInCircle(label, 10, limit, 6);
      chosenLines = res.lines.length > 0 ? res.lines : [label];
    }
  }

  const roundedDiameter = Math.round(chosenDiameter);
  return {
    width: roundedDiameter,
    height: roundedDiameter,
    fontSize: chosenFontSize,
    formattedLabel: chosenLines.join("\n"),
  };
}
