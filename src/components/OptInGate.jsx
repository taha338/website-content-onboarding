/**
 * OptInGate — a "Do you need this section?" prompt that wraps optional
 * stage content. If the user picks "No", the stage is collapsed to a
 * one-line summary and the Continue button immediately moves them on.
 *
 * Usage:
 *   <OptInGate
 *     label="Do you want Op1776 to manage your domain, email, and hosting?"
 *     yesLabel="Yes — collect access"
 *     noLabel="No — skip this section"
 *     value={state.optInDomainHostingEmail}
 *     onChange={(v) => update({ optInDomainHostingEmail: v })}
 *   >
 *     {/* fields here render only when value === 'yes' *\/}
 *   </OptInGate>
 */
import { Check, X } from 'lucide-react';

export default function OptInGate({ label, help, yesLabel = 'Yes', noLabel = 'No, skip', value, onChange, children }) {
  return (
    <div>
      <div className="p-5 rounded-xl border border-[var(--color-op-line)] bg-[var(--color-op-cream)]">
        <p className="font-semibold text-[var(--color-op-ink)] mb-1">{label}</p>
        {help && <p className="op-help mb-3">{help}</p>}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            type="button"
            onClick={() => onChange('yes')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
              value === 'yes'
                ? 'bg-[var(--color-op-red)] text-white'
                : 'bg-white border border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-red)]'
            }`}
          >
            <Check size={16} /> {yesLabel}
          </button>
          <button
            type="button"
            onClick={() => onChange('no')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
              value === 'no'
                ? 'bg-[var(--color-op-black)] text-white'
                : 'bg-white border border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-ink)]'
            }`}
          >
            <X size={16} /> {noLabel}
          </button>
        </div>
      </div>
      {value === 'yes' && (
        <div className="mt-6 space-y-6">{children}</div>
      )}
      {value === 'no' && (
        <p className="mt-4 text-sm text-[var(--color-op-muted)] italic">
          Skipped. You can come back to this stage later from the progress bar above.
        </p>
      )}
    </div>
  );
}
