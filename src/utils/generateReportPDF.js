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

  // Capture DOM-relative Y coordinates of break boundaries BEFORE rasterizing.
  // - Section tops are the strongly-preferred break points (between cards).
  // - Field bottoms are acceptable fallbacks (between rows inside a card).
  const nodeRect = node.getBoundingClientRect();
  const sectionTopsSrc = Array.from(node.querySelectorAll('[data-pdf-section]'))
    .map((el) => el.getBoundingClientRect().top - nodeRect.top)
    .filter((y) => y > 0);
  const fieldBottomsSrc = Array.from(node.querySelectorAll('[data-pdf-field]'))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom - nodeRect.top;
    })
    .filter((y) => y > 0);
  const sourceHeight = node.scrollHeight;

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
    onclone: (_doc, clonedNode) => freezeColors(clonedNode, node),
  });

  const srcToCanvas = canvas.height / sourceHeight;
  const sectionTops = sectionTopsSrc.map((y) => Math.round(y * srcToCanvas));
  const fieldBottoms = fieldBottomsSrc.map((y) => Math.round(y * srcToCanvas));

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const topMargin = 32;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const usableHeight = pageHeight - topMargin;

  if (imgHeight <= usableHeight) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, topMargin, imgWidth, imgHeight);
  } else {
    const pxPerPage = Math.floor((usableHeight * canvas.width) / pageWidth);
    const minSlice = Math.floor(pxPerPage * 0.5);

    // Pick the largest boundary in (yOffset+minSlice, yOffset+pxPerPage].
    // Prefer section tops; fall back to field bottoms; finally, hard cut.
    const pickBreak = (yOffset) => {
      const lo = yOffset + minSlice;
      const hi = yOffset + pxPerPage;
      const within = (arr) => {
        let best = -1;
        for (const y of arr) {
          if (y > lo && y <= hi && y > best) best = y;
        }
        return best;
      };
      const s = within(sectionTops);
      if (s > 0) return s;
      const f = within(fieldBottoms);
      if (f > 0) return f;
      return hi;
    };

    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < canvas.height) {
      const remaining = canvas.height - yOffset;
      let sliceHeight;
      if (remaining <= pxPerPage) {
        sliceHeight = remaining;
      } else {
        sliceHeight = pickBreak(yOffset) - yOffset;
      }

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, topMargin, imgWidth, sliceImgHeight);

      yOffset += sliceHeight;
      pageIndex += 1;
    }
  }

  pdf.save(fileName);
  return pdf;
}
