import { User, Flag, HeartHandshake, Landmark } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { SUBJECT_TYPES } from '../lib/options';

const ICONS = { candidate: User, party: Flag, nonprofit: HeartHandshake, pac: Landmark };

export default function SubjectTypeToggle() {
  const { state, update } = useContent();
  return (
    <div>
      <p className="op-label">Confirm subject type</p>
      <p className="op-help mb-3">Auto-pulled from Form 1 when available; pick manually if it didn't load.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUBJECT_TYPES.map((opt) => {
          const selected = state.subjectType === opt.id;
          const Icon = ICONS[opt.id] || User;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => update({ subjectType: opt.id })}
              className={`flex flex-col gap-2.5 p-4 rounded-xl border text-left transition-all ${
                selected
                  ? 'bg-[var(--color-op-red)] border-[var(--color-op-red)] text-white shadow-lg'
                  : 'bg-white border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-red)]'
              }`}
            >
              <span className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                selected ? 'bg-white/15' : 'bg-[var(--color-op-cream)]'
              }`}>
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base leading-snug">{opt.label}</span>
                <span className={`block text-xs mt-1 leading-snug ${selected ? 'text-white/80' : 'text-[var(--color-op-muted)]'}`}>
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
