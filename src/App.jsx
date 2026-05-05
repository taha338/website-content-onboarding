/**
 * Form 3 — Website Content (Operation 1776)
 *
 * Scaffold v0. Gates on Form 1 + Form 2 being submitted for the same
 * client_id. Sections 1–25 will be wired up incrementally; this v0
 * shows the brand shell + prefill loading state so we have a working
 * deploy to iterate against.
 */
import { useEffect, useState } from 'react';
import Header from './components/Header';

function readClientIdFromUrl() {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams(window.location.search);
  return p.get('client_id') || p.get('clientId') || '';
}

export default function App() {
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    setClientId(readClientIdFromUrl());
  }, []);

  return (
    <div className="op-paper min-h-screen pb-20">
      <Header subjectLabel="Website Content" clientId={clientId} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-10 text-center">
          <p className="op-section-num mb-2">FORM 3 · WEBSITE CONTENT</p>
          <h2 className="font-display text-3xl md:text-5xl uppercase mb-3">
            Build the Story
          </h2>
          <p className="font-script text-2xl text-[var(--color-op-red)] mb-4">
            Where the website actually comes from.
          </p>
          <p className="text-sm text-[var(--color-op-muted)] max-w-xl mx-auto leading-relaxed">
            Biographical content, issue elaboration, leadership profiles, endorsed
            candidates, photos, social handles, compliance copy, and everything
            we'll use to build out your site pages.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-dashed border-[var(--color-op-line)] bg-white text-center">
          <p className="font-display text-lg uppercase text-[var(--color-op-ink)] mb-2">v0 — coming soon</p>
          <p className="text-sm text-[var(--color-op-muted)] max-w-md mx-auto leading-relaxed">
            Form 3 is being built out. Sections 1–25 (identity, biography,
            narrative, issues, record, risk, compliance, endorsed candidates,
            events, media, social, fundraising, voter resources, governance, SEO)
            will land in subsequent commits.
          </p>
          <p className="mt-4 text-xs text-[var(--color-op-muted)]">
            client_id: <code className="font-mono">{clientId || '— not set —'}</code>
          </p>
        </div>
      </main>
    </div>
  );
}
