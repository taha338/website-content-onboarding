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

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    const pxPerPage = Math.floor((pageHeight * canvas.width) / pageWidth);

    // Find page-break Y positions that don't slice through content. We scan
    // backward from the maximum-fit row looking for a row of nearly-white
    // pixels (i.e. a gap between cards / sections). Falls back to pxPerPage
    // if no clean gap is found in the lookback window.
    const findCleanBreak = (sourceCanvas, startY, maxY) => {
      const lookback = Math.min(Math.floor(pxPerPage * 0.18), maxY - startY - 1);
      if (lookback <= 0) return maxY;
      try {
        const ctx = sourceCanvas.getContext('2d');
        const region = ctx.getImageData(0, maxY - lookback, sourceCanvas.width, lookback);
        const w = sourceCanvas.width;
        const data = region.data;
        for (let row = lookback - 1; row >= 0; row -= 1) {
          let nonWhite = 0;
          const base = row * w * 4;
          for (let x = 0; x < w; x += 4) {
            const i = base + x * 4;
            if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) {
              nonWhite += 1;
              if (nonWhite > 2) break;
            }
          }
          if (nonWhite <= 2) return maxY - lookback + row;
        }
      } catch { /* tainted canvas — fall through */ }
      return maxY;
    };

    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < canvas.height) {
      const remaining = canvas.height - yOffset;
      let sliceHeight;
      if (remaining <= pxPerPage) {
        sliceHeight = remaining;
      } else {
        const breakY = findCleanBreak(canvas, yOffset, yOffset + pxPerPage);
        sliceHeight = Math.max(breakY - yOffset, Math.floor(pxPerPage * 0.5));
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
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgWidth, sliceImgHeight);

      yOffset += sliceHeight;
      pageIndex += 1;
    }
  }

  pdf.save(fileName);
  return pdf;
}
