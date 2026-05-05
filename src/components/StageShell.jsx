/**
 * Stage wrapper — renders one stage at a time with framer-motion
 * fade/slide transitions between stages, a back button, and a continue
 * button at the bottom. Used by the multi-stage Form 1 wizard.
 */
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useContent } from '../context/ContentContext';

export default function StageShell({
  number,
  title,
  subtitle,
  children,
  canContinue = true,
  continueLabel = 'Continue',
  onContinue,
  isFirst = false,
  isLast = false,
  hideContinue = false,
}) {
  const { prevStage, nextStage } = useContent();

  const handleContinue = () => {
    if (!canContinue) return;
    if (onContinue) onContinue();
    else nextStage();
  };

  return (
    <motion.div
      key={number}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-3xl mx-auto px-6 py-10"
    >
      {/* Header */}
      <div className="mb-8">
        <p className="op-section-num mb-3">STAGE {number}</p>
        <h2 className="font-display text-3xl md:text-5xl uppercase mb-2 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base text-[var(--color-op-muted)] max-w-xl">{subtitle}</p>
        )}
      </div>

      {/* Stage body */}
      <div className="space-y-6">{children}</div>

      {/* Nav */}
      <div className="mt-12 pt-8 border-t border-[var(--color-op-line)] flex items-center justify-between gap-4">
        {!isFirst ? (
          <button
            type="button"
            onClick={prevStage}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--color-op-cream)] text-[var(--color-op-ink)] font-semibold hover:bg-[var(--color-op-line)] transition-colors"
          >
            <ChevronLeft size={18} /> Back
          </button>
        ) : <div />}

        {!hideContinue && (
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={`inline-flex items-center gap-2 px-7 py-3 rounded-lg font-display tracking-widest uppercase shadow-lg transition-all ${
              canContinue
                ? 'bg-[var(--color-op-red)] text-white hover:bg-[var(--color-op-red-deep)] active:scale-95'
                : 'bg-[var(--color-op-line)] text-[var(--color-op-muted)] cursor-not-allowed'
            }`}
          >
            {continueLabel}
            {!isLast && <ChevronRight size={18} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}
