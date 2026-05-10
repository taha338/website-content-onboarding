import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Capture a static report DOM node and slice it across A4 pages.
 * Mirrors the political-brand-discovery PDF pipeline so the campaign
 * intake summary renders with the same Op1776 visual identity.
 */
export async function generateReportPDF(node, fileName = 'report.pdf') {
  if (!node) throw new Error('generateReportPDF: node is required');

  await new Promise((r) => requestAnimationFrame(() => r()));
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch { /* noop */ }
  }

  const probeCtx = (() => {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c.getContext('2d', { willReadFrequently: true });
  })();

  const toRgb = (cssColor) => {
    if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') return cssColor;
    try {
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = '#000';
      probeCtx.fillStyle = cssColor;
      probeCtx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
      return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    } catch {
      return cssColor;
    }
  };

  const UNSUPPORTED_RE = /\b(oklch|oklab|lab|lch|color\()/i;

  const sanitizeMulti = (value) => {
    if (!value || !UNSUPPORTED_RE.test(value)) return value;
    return value.replace(/(oklch|oklab|lab|lch)\([^)]*\)|color\([^)]*\)/gi, (m) => toRgb(m));
  };

  const COLOR_PROPS = [
    'color', 'backgroundColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke', 'columnRuleColor', 'textDecorationColor', 'caretColor',
  ];

  const freezeColors = (clonedRoot, sourceRoot) => {
    if (!clonedRoot || !sourceRoot) return;
    const clonedAll = [clonedRoot, ...clonedRoot.querySelectorAll('*')];
    const sourceAll = [sourceRoot, ...sourceRoot.querySelectorAll('*')];
    const len = Math.min(clonedAll.length, sourceAll.length);
    for (let i = 0; i < len; i += 1) {
      const cs = window.getComputedStyle(sourceAll[i]);
      for (const prop of COLOR_PROPS) {
        const value = cs[prop];
        if (!value) continue;
        const safe = UNSUPPORTED_RE.test(value) ? toRgb(value) : value;
        try { clonedAll[i].style[prop] = safe; } catch { /* ignore */ }
      }
      const bgImage = cs.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const safeBg = sanitizeMulti(bgImage);
        try { clonedAll[i].style.backgroundImage = safeBg; } catch { /* ignore */ }
      }
      const boxShadow = cs.boxShadow;
      if (boxShadow && boxShadow !== 'none' && UNSUPPORTED_RE.test(boxShadow)) {
        try { clonedAll[i].style.boxShadow = 'none'; } catch { /* ignore */ }
      }
    }
  };

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
    onclone: (_doc, clonedNode) => freezeColors(clonedNode, node),
  });

  // Render as a single continuous page sized to the captured content. No A4
  // pagination, so cards/sections are never sliced across page breaks.
  const pageWidth = 595.28;
  const pageHeight = (canvas.height * pageWidth) / canvas.width;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [pageWidth, pageHeight],
  });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageWidth, pageHeight);
  pdf.save(fileName);
  return pdf;
}
