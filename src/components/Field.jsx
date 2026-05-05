/**
 * Reusable form primitives used across all sections of Form 1.
 * Visual styling pulls from index.css design tokens (op-* utilities).
 */
import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';

export function Label({ children, optional, secret, required }) {
  return (
    <label className="op-label flex items-center gap-2">
      <span>
        {children}
        {required && <span className="text-[var(--color-op-red)] ml-0.5">*</span>}
      </span>
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

export function TextField({ label, value, onChange, placeholder, help, optional, required, secret, type = 'text', autoComplete = 'off' }) {
  const [reveal, setReveal] = useState(!secret);
  const inputType = secret && !reveal ? 'password' : type;
  return (
    <div>
      <Label optional={optional} secret={secret} required={required}>{label}</Label>
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

export function TextArea({ label, value, onChange, placeholder, help, optional, required, secret, rows = 4 }) {
  return (
    <div>
      <Label optional={optional} secret={secret} required={required}>{label}</Label>
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

export function Select({ label, value, onChange, options, help, optional, required, placeholder = 'Select…' }) {
  // options: array of strings or {id, label}
  const norm = options.map((o) => typeof o === 'string' ? { id: o, label: o } : o);
  return (
    <div>
      <Label optional={optional} required={required}>{label}</Label>
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

export function RadioGroup({ label, value, onChange, options, help, optional, required }) {
  const norm = options.map((o) => typeof o === 'string' ? { id: o, label: o } : o);
  return (
    <div>
      <Label optional={optional} required={required}>{label}</Label>
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

/* Section wrapper — collapsible accordion. Starts collapsed by default;
   user clicks the header to expand. Also listens for window-level
   op:expandAll / op:collapseAll / op:openSection events from SectionNav. */
export function Section({ index, title, subtitle, children, hidden, condition, defaultOpen = false, id }) {
  const sectionId = id || `section-${(index || title || '').toString().toLowerCase().replace(/\W+/g, '-')}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const onExpandAll = () => setOpen(true);
    const onCollapseAll = () => setOpen(false);
    const onOpenSection = (e) => { if (e.detail?.id === sectionId) setOpen(true); };
    window.addEventListener('op:expandAll', onExpandAll);
    window.addEventListener('op:collapseAll', onCollapseAll);
    window.addEventListener('op:openSection', onOpenSection);
    return () => {
      window.removeEventListener('op:expandAll', onExpandAll);
      window.removeEventListener('op:collapseAll', onCollapseAll);
      window.removeEventListener('op:openSection', onOpenSection);
    };
  }, [sectionId]);

  if (hidden) return null;
  return (
    <section id={sectionId} className="scroll-mt-24 mb-3" data-condition={condition}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 text-left rounded-lg border transition-colors ${
          open
            ? 'border-[var(--color-op-line)] bg-white px-4 py-3'
            : 'border-[var(--color-op-line)] bg-white/70 hover:bg-white px-4 py-3'
        }`}
      >
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-transform ${
            open ? 'rotate-90 bg-[var(--color-op-red)] text-white' : 'bg-[var(--color-op-cream)] text-[var(--color-op-muted)]'
          }`}
        >
          <ChevronRight size={14} />
        </span>
        <span className="op-section-num !text-xs">{index}</span>
        <span className="font-display text-base md:text-lg uppercase tracking-wider text-[var(--color-op-ink)] flex-1">
          {title}
        </span>
        {!open && subtitle && (
          <span className="hidden md:inline text-xs text-[var(--color-op-muted)] truncate max-w-md">
            {subtitle}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pt-4 pb-6 border-x border-b border-[var(--color-op-line)] bg-white rounded-b-lg -mt-px">
          {subtitle && (
            <p className="text-sm text-[var(--color-op-muted)] mb-5 max-w-2xl">{subtitle}</p>
          )}
          <div className="space-y-5">{children}</div>
        </div>
      )}
    </section>
  );
}
