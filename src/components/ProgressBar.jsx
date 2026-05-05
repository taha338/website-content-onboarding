/**
 * Top-of-page sticky progress indicator. Shows a horizontal pill bar
 * with one slot per stage, current stage highlighted, completed stages
 * filled. Click a completed stage to jump back.
 */
import { useContent } from '../context/ContentContext';

export default function ProgressBar({ stages }) {
  const { state, goToStage } = useContent();
  const { currentStage, completedStages } = state;
  const total = stages.length;
  const progressPct = ((currentStage + 1) / total) * 100;

  return (
    <div className="no-print sticky top-0 z-50 bg-white border-b border-[var(--color-op-line)]">
      <div className="max-w-5xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-baseline gap-2 text-xs">
            <span className="op-section-num !text-[10px]">STAGE {currentStage + 1} / {total}</span>
            <span className="font-semibold text-[var(--color-op-ink)]">
              {stages[currentStage]?.label}
            </span>
          </div>
          <span className="text-xs text-[var(--color-op-muted)] font-mono">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {stages.map((s, i) => {
            const completed = completedStages.includes(i);
            const active = i === currentStage;
            const reachable = completed || active || i < currentStage;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => reachable && goToStage(i)}
                disabled={!reachable}
                title={s.label}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  active
                    ? 'bg-[var(--color-op-red)]'
                    : completed
                      ? 'bg-[var(--color-op-black)]'
                      : 'bg-[var(--color-op-line)]'
                } ${reachable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
