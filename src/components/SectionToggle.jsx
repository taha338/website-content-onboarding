/**
 * Inline checkbox toggle for opt-in subsections (Wix-style "Include this?"
 * checkboxes). Renders the children only when checked. Used for sections
 * 1.4, 1.5, 4, 5.1, 5.2, 6 to mirror the Wix form's behavior of hiding
 * optional sub-items behind a single click.
 */
import { Check } from 'lucide-react';

export default function SectionToggle({ label, help, checked, onChange, children }) {
  return (
    <div className="rounded-lg border border-[var(--color-op-line)] bg-white">
      <label className="flex items-start gap-3 p-4 cursor-pointer">
        <span
          className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
            checked
              ? 'bg-[var(--color-op-red)] border-[var(--color-op-red)] text-white'
              : 'bg-white border-[var(--color-op-line)]'
          }`}
        >
          {checked && <Check size={14} strokeWidth={3} />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-[var(--color-op-ink)]">{label}</span>
          {help && <span className="op-help">{help}</span>}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
      {checked && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[var(--color-op-line)]">
          {children}
        </div>
      )}
    </div>
  );
}
