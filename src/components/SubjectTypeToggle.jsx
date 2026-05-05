import { User, Flag } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { SUBJECT_TYPES } from '../lib/options';

export default function SubjectTypeToggle() {
  const { state, update } = useContent();
  return (
    <div>
      <p className="op-label">Confirm subject type</p>
      <p className="op-help mb-3">Auto-pulled from Form 1 when available; pick manually if it didn't load.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {SUBJECT_TYPES.map((opt) => {
          const selected = state.subjectType === opt.id;
          const Icon = opt.id === 'candidate' ? User : Flag;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => update({ subjectType: opt.id })}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                selected
                  ? 'bg-[var(--color-op-red)] border-[var(--color-op-red)] text-white shadow-lg'
                  : 'bg-white border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-red)]'
              }`}
            >
              <span className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg ${
                selected ? 'bg-white/15' : 'bg-[var(--color-op-cream)]'
              }`}>
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-display tracking-wider text-lg">{opt.label}</span>
                <span className={`block text-xs mt-1 ${selected ? 'text-white/80' : 'text-[var(--color-op-muted)]'}`}>
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
