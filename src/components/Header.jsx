/**
 * Reusable brand header — Operation 1776 stencil + tagline + client_id chip.
 * Decoupled from any context so it works in both Form 1 and Form 3.
 */
export default function Header({ subjectLabel = '', clientId = '' }) {
  return (
    <header className="op-strip sticky top-0 z-40 no-print">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-white text-xl md:text-2xl tracking-widest">
            OPERATION <span className="text-[var(--color-op-red)]">1776</span>
          </h1>
          <span className="hidden sm:inline font-script text-white/70 text-base">
            Rooted in Freedom. Driven by Purpose.
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {subjectLabel && <span className="hidden md:inline text-white/60">{subjectLabel}</span>}
          {clientId && (
            <span className="px-2 py-1 rounded bg-white/10 text-white font-mono text-[11px]">
              {clientId}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
