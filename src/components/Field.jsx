/**
 * Reusable form primitives used across all sections of Form 1.
 * Visual styling pulls from index.css design tokens (op-* utilities).
 */
import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export function Label({ children, optional, secret }) {
  return (
    <label className="op-label flex items-center gap-2">
      <span>{children}</span>
      {optional && <span className="text-xs font-medium text-[var(--color-op-muted)]">(optional)</span>}
      {secret && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
          <Lock size={10} /> Secret
        </span>
      )}
    </label>
  );
}

export function Help({ children }) {
  if (!children) return null;
  return <p className="op-help">{children}</p>;
}

export function TextField({ label, value, onChange, placeholder, help, optional, secret, type = 'text', autoComplete = 'off' }) {
  const [reveal, setReveal] = useState(!secret);
  const inputType = secret && !reveal ? 'password' : type;
  return (
    <div>
      <Label optional={optional} secret={secret}>{label}</Label>
      <div className="relative">
        <input
          className="op-input"
          type={inputType}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={false}
          style={secret ? { paddingRight: 44 } : undefined}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-op-muted)] hover:text-[var(--color-op-ink)]"
            aria-label={reveal ? 'Hide' : 'Show'}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <Help>{help}</Help>
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, help, optional, secret, rows = 4 }) {
  return (
    <div>
      <Label optional={optional} secret={secret}>{label}</Label>
      <textarea
        className="op-input resize-y"
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      <Help>{help}</Help>
    </div>
  );
}

export function Select({ label, value, onChange, options, help, optional, placeholder = 'Select…' }) {
  // options: array of strings or {id, label}
  const norm = options.map((o) => typeof o === 'string' ? { id: o, label: o } : o);
  return (
    <div>
      <Label optional={optional}>{label}</Label>
      <select
        className="op-input bg-white"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {norm.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <Help>{help}</Help>
    </div>
  );
}

export function RadioGroup({ label, value, onChange, options, help, optional }) {
  const norm = options.map((o) => typeof o === 'string' ? { id: o, label: o } : o);
  return (
    <div>
      <Label optional={optional}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {norm.map((o) => {
          const selected = value === o.id;
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => onChange(o.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                selected
                  ? 'bg-[var(--color-op-red)] border-[var(--color-op-red)] text-white shadow'
                  : 'bg-white border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-red)]'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <Help>{help}</Help>
    </div>
  );
}

export function MultiSelectChips({ label, values, onChange, options, help, optional }) {
  const norm = options.map((o) => typeof o === 'string' ? { id: o, label: o } : o);
  const toggle = (id) => {
    const set = new Set(values || []);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange(Array.from(set));
  };
  return (
    <div>
      <Label optional={optional}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {norm.map((o) => {
          const on = (values || []).includes(o.id);
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => toggle(o.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                on
                  ? 'bg-[var(--color-op-black)] border-[var(--color-op-black)] text-white'
                  : 'bg-white border-[var(--color-op-line)] text-[var(--color-op-ink)] hover:border-[var(--color-op-ink)]'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <Help>{help}</Help>
    </div>
  );
}

/* Two-column layout helper for paired fields */
export function TwoCol({ children }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

/* Section wrapper with the brand divider strip */
export function Section({ index, title, subtitle, children, hidden, condition }) {
  if (hidden) return null;
  return (
    <section className="mb-12 scroll-mt-32" data-condition={condition}>
      <div className="op-strip h-1.5 mb-5 rounded-sm" />
      <div className="flex items-baseline gap-3 mb-1">
        <span className="op-section-num">{index}</span>
        <h2 className="font-display text-2xl md:text-3xl text-[var(--color-op-ink)] uppercase">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-sm text-[var(--color-op-muted)] mb-6 max-w-2xl">{subtitle}</p>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}
