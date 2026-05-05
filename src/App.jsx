/**
 * Form 3 — Website Content (Operation 1776)
 *
 * Reads Client ID from URL, pre-fills from Form 1 + Form 2 ClickUp
 * tasks via the /api/clickup-prefill route, and renders all 25
 * sections with subject-type conditional logic.
 */
import { useEffect } from 'react';
import { ContentProvider, useContent } from './context/ContentContext';
import { fetchPrefill, readClientIdFromUrl } from './lib/clickup';
import Header from './components/Header';
import SubjectTypeToggle from './components/SubjectTypeToggle';
import {
  S1Identity, S2ACandidateBio, S2BPartyProfile, S2CLeadership,
  S3Narrative, S4Issues, S5Record, S6RiskLegal, S7Compliance,
  S8DataGov, S9Endorsed, S10Events, S11Media, S12Social,
  S13Inspiration, S14Press, S16SiteCompliance, S17SiteStructure,
  S18EmailContent, S19Fundraising, S20VoterResources, S21Membership,
  S22PublicGov, S23SEO, S24Transactional, S25Volunteer,
} from './components/sections';

function PrefillBoot() {
  const { state, dispatch } = useContent();

  useEffect(() => {
    const cid = readClientIdFromUrl();
    dispatch({ type: 'UPDATE', payload: { clientId: cid } });
    if (!cid) {
      dispatch({ type: 'SET_PREFILL_STATUS', payload: { status: 'empty' } });
      return;
    }
    dispatch({ type: 'SET_PREFILL_STATUS', payload: { status: 'loading' } });
    fetchPrefill(cid)
      .then((data) => {
        if (!data?.found) {
          dispatch({ type: 'SET_PREFILL_STATUS', payload: { status: 'empty' } });
          return;
        }
        dispatch({
          type: 'PREFILL',
          payload: {
            clickupTaskId: data.taskId || '',
            displayName:   data.tradeName || '',
            subjectType:   data.subjectType || '',
            // Form 1 → Form 3 pre-fill is best-effort; fields will fill in
            // as we wire more custom field reads on the backend.
          },
        });
      })
      .catch((err) => {
        dispatch({ type: 'SET_PREFILL_STATUS', payload: { status: 'error', error: err.message } });
      });
  }, [dispatch]);

  if (state.prefillStatus === 'loading') {
    return (
      <div className="bg-amber-50 border-y border-amber-200 text-amber-900 text-xs no-print">
        <div className="max-w-5xl mx-auto px-6 py-2">Loading client data from ClickUp…</div>
      </div>
    );
  }
  if (state.prefillStatus === 'error') {
    return (
      <div className="bg-red-50 border-y border-red-200 text-red-900 text-xs no-print">
        <div className="max-w-5xl mx-auto px-6 py-2">
          Couldn't pre-fill from ClickUp ({state.prefillError}). You can still complete the form manually.
        </div>
      </div>
    );
  }
  if (state.prefillStatus === 'empty') {
    return (
      <div className="bg-amber-50 border-y border-amber-200 text-amber-900 text-xs no-print">
        <div className="max-w-5xl mx-auto px-6 py-2">
          No <code className="font-mono">?client_id=</code> in URL. Use the link from your ClickUp task to auto-fill known information.
        </div>
      </div>
    );
  }
  return null;
}

function SubmitBlock() {
  const { state, dispatch } = useContent();
  const submit = async () => {
    dispatch({ type: 'SET_SUBMIT_STATE', payload: { submitting: true, submitError: '' } });
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 300));
      }
      dispatch({ type: 'SET_SUBMIT_STATE', payload: { submitting: false, submitted: true } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      dispatch({ type: 'SET_SUBMIT_STATE', payload: { submitting: false, submitError: err.message || 'Submit failed' } });
    }
  };

  if (state.submitted) {
    return (
      <div className="my-12 p-8 rounded-2xl border border-emerald-200 bg-emerald-50 text-center">
        <p className="font-display text-2xl text-emerald-900 uppercase mb-2">Submitted</p>
        <p className="font-script text-xl text-emerald-700 mb-3">All set. We'll build from here.</p>
      </div>
    );
  }

  return (
    <div className="my-12 p-6 rounded-2xl border border-[var(--color-op-line)] bg-white">
      <p className="text-sm text-[var(--color-op-muted)] mb-4">
        Once submitted, the Operation 1776 team will pick this up and start
        producing site content. You can return to this same link to edit later.
      </p>
      <button
        type="button"
        onClick={submit}
        disabled={state.submitting}
        className="font-display tracking-widest px-8 py-4 rounded-lg bg-[var(--color-op-red)] text-white uppercase text-lg shadow-lg hover:bg-[var(--color-op-red-deep)] disabled:bg-[var(--color-op-muted)] transition-colors"
      >
        {state.submitting ? 'Submitting…' : 'Submit Content'}
      </button>
      {state.submitError && (
        <p className="mt-3 text-sm text-red-700">{state.submitError}</p>
      )}
    </div>
  );
}

function FormBody() {
  const { state, subjectChosen } = useContent();
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-10 text-center">
        <p className="op-section-num mb-2">FORM 3 · WEBSITE CONTENT</p>
        <h2 className="font-display text-3xl md:text-5xl uppercase mb-3">Build the Story</h2>
        <p className="font-script text-2xl text-[var(--color-op-red)] mb-4">Where the website actually comes from.</p>
        <p className="text-sm text-[var(--color-op-muted)] max-w-xl mx-auto leading-relaxed">
          Biographical content, issue elaboration, leadership profiles, endorsed
          candidates, photos, social handles, compliance copy, and everything we'll
          use to build out your site pages.
        </p>
      </div>

      <SubjectTypeToggle />

      {!subjectChosen && (
        <div className="my-8 p-4 rounded-lg border border-dashed border-[var(--color-op-line)] bg-[var(--color-op-cream)] text-sm text-[var(--color-op-muted)] text-center">
          Pick subject type above to see all sections.
        </div>
      )}

      {subjectChosen && (
        <>
          <S1Identity />
          <S2ACandidateBio />
          <S2BPartyProfile />
          <S2CLeadership />
          <S3Narrative />
          <S4Issues />
          <S5Record />
          <S6RiskLegal />
          <S7Compliance />
          <S8DataGov />
          <S9Endorsed />
          <S10Events />
          <S11Media />
          <S12Social />
          <S13Inspiration />
          <S14Press />
          <S16SiteCompliance />
          <S17SiteStructure />
          <S18EmailContent />
          <S19Fundraising />
          <S20VoterResources />
          <S21Membership />
          <S22PublicGov />
          <S23SEO />
          <S24Transactional />
          <S25Volunteer />
          <SubmitBlock />
        </>
      )}

      <footer className="mt-16 mb-10 pt-6 border-t border-[var(--color-op-line)] text-center text-xs text-[var(--color-op-muted)]">
        <p>Operation 1776 · Website Content · {state.clientId ? `client ${state.clientId}` : 'no client_id loaded'}</p>
      </footer>
    </main>
  );
}

function HeaderWithClientId() {
  const { state } = useContent();
  return <Header subjectLabel="Website Content" clientId={state.clientId} />;
}

export default function App() {
  return (
    <ContentProvider>
      <div className="op-paper min-h-screen pb-20">
        <HeaderWithClientId />
        <PrefillBoot />
        <FormBody />
      </div>
    </ContentProvider>
  );
}
