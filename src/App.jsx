/**
 * Form 3 — Website Content (Operation 1776)
 *
 * Multi-stage wizard mirroring Form 1 / Brand Discovery patterns:
 * 8 stages, framer-motion transitions, prev/next, required-field
 * validation, "do you need this?" gates for optional content groups.
 */
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ContentProvider, useContent } from './context/ContentContext';
import { fetchPrefill, readClientIdFromUrl } from './lib/clickup';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import StageShell from './components/StageShell';
import SubjectTypeToggle from './components/SubjectTypeToggle';
import OptInGate from './components/OptInGate';
import {
  S1Identity, S2ACandidateBio, S2BPartyProfile, S2CLeadership,
  S3Narrative, S4Issues, S5Record, S6RiskLegal, S7Compliance,
  S8DataGov, S9Endorsed, S10Events, S11Media, S12Social,
  S13Inspiration, S14Press, S16SiteCompliance, S17SiteStructure,
  S18EmailContent, S19Fundraising, S20VoterResources, S21Membership,
  S22PublicGov, S23SEO, S24Transactional, S25Volunteer,
} from './components/sections';

const STAGE_LIST = [
  { id: 'identity',    label: 'Identity',           Component: () => <Stage1Identity /> },
  { id: 'profile',     label: 'Bio / Profile',      Component: () => <Stage2Profile /> },
  { id: 'narrative',   label: 'Narrative',          Component: () => <Stage3Narrative /> },
  { id: 'issues',      label: 'Issues',             Component: () => <Stage4Issues /> },
  { id: 'record',      label: 'Record',             Component: () => <Stage5Record /> },
  { id: 'compliance',  label: 'Compliance & Data',  Component: () => <Stage6Compliance /> },
  { id: 'media-social',label: 'Media & Social',     Component: () => <Stage7MediaSocial /> },
  { id: 'site-pages',  label: 'Site Pages',         Component: () => <Stage8SitePages /> },
  { id: 'review',      label: 'Review',             Component: () => <Stage9Review /> },
];

function Stage1Identity() {
  const { state } = useContent();
  const canContinue = Boolean(state.subjectType);
  return (
    <StageShell number={1} title="Subject & Identity" subtitle="Confirm subject type (auto-pulled from Form 1) and the basics." isFirst canContinue={canContinue}>
      <SubjectTypeToggle />
      {(state.subjectType === 'candidate' || state.subjectType === 'party') && (
        <div className="mt-4">
          <S1Identity />
        </div>
      )}
    </StageShell>
  );
}

function Stage2Profile() {
  const { isCandidate, isParty } = useContent();
  return (
    <StageShell number={2} title={isCandidate ? 'Biography' : 'Party Profile'} subtitle={isCandidate ? 'Where the candidate comes from, and who they are.' : 'Founding, mission, structure.'}>
      <S2ACandidateBio />
      <S2BPartyProfile />
      {isParty && <S2CLeadership />}
    </StageShell>
  );
}

function Stage3Narrative() {
  return (
    <StageShell number={3} title="Narrative & Messaging" subtitle="The story you tell on the homepage and 'about' pages.">
      <S3Narrative />
    </StageShell>
  );
}

function Stage4Issues() {
  return (
    <StageShell number={4} title="Issues / Platform" subtitle="Up to 5 issues. Names pre-fill from Form 2 priorities/pillars.">
      <S4Issues />
    </StageShell>
  );
}

function Stage5Record() {
  return (
    <StageShell number={5} title="Record, Risk & Compliance" subtitle="Receipts and disclosures.">
      <S5Record />
      <S6RiskLegal />
      <S7Compliance />
    </StageShell>
  );
}

function Stage6Compliance() {
  const { isParty } = useContent();
  return (
    <StageShell number={6} title="Data Governance & Endorsements">
      <S8DataGov />
      {isParty && <S9Endorsed />}
    </StageShell>
  );
}

function Stage7MediaSocial() {
  return (
    <StageShell number={7} title="Events, Media & Social" subtitle="Calendar, photos, video, and every social handle you have.">
      <S10Events />
      <S11Media />
      <S12Social />
      <S13Inspiration />
      <S14Press />
    </StageShell>
  );
}

function Stage8SitePages() {
  const { isCandidate, isParty } = useContent();
  return (
    <StageShell number={8} title="Site Pages & Content" subtitle="Compliance pages, structure, email content, fundraising, and subject-specific extras.">
      <S16SiteCompliance />
      <S17SiteStructure />
      <S18EmailContent />
      <S19Fundraising />
      {isCandidate && <S20VoterResources />}
      {isParty && <S21Membership />}
      {isParty && <S22PublicGov />}
      <S23SEO />
      <S24Transactional />
      <S25Volunteer />
    </StageShell>
  );
}

function Stage9Review() {
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
      <StageShell number={9} title="Submitted" hideContinue isLast>
        <div className="p-8 rounded-2xl border border-emerald-200 bg-emerald-50 text-center">
          <p className="font-display text-3xl text-emerald-900 uppercase mb-2">All set</p>
          <p className="font-script text-2xl text-emerald-700 mb-3">We'll build from here.</p>
          <p className="text-sm text-emerald-800">
            Your website content has been received. Op1776 will start producing site pages.
          </p>
        </div>
      </StageShell>
    );
  }
  return (
    <StageShell number={9} title="Review & Submit" subtitle="One last review, then we take it from here." isLast hideContinue>
      <div className="p-6 rounded-2xl border border-[var(--color-op-line)] bg-white">
        <p className="text-sm text-[var(--color-op-muted)] mb-4">
          Submitting writes to Supabase and notifies the Op1776 team in ClickUp.
          You can return to this same link to edit later.
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
    </StageShell>
  );
}

function PrefillBoot() {
  const { state, dispatch } = useContent();
  useEffect(() => {
    const cid = readClientIdFromUrl();
    dispatch({ type: 'UPDATE', payload: { clientId: cid } });
    if (!cid) return;
    fetchPrefill(cid)
      .then((data) => {
        if (!data?.found) return;
        dispatch({
          type: 'PREFILL',
          payload: {
            clickupTaskId: data.taskId || '',
            displayName:   data.tradeName || '',
            subjectType:   data.subjectType || '',
          },
        });
      })
      .catch(() => { /* silent */ });
  }, [dispatch]);
  return null;
}

function Wizard() {
  const { state } = useContent();
  const Stage = STAGE_LIST[state.currentStage]?.Component;
  return (
    <>
      <ProgressBar stages={STAGE_LIST} />
      <AnimatePresence mode="wait">
        {Stage && <Stage key={state.currentStage} />}
      </AnimatePresence>
    </>
  );
}

function HeaderWithClient() {
  const { state } = useContent();
  return <Header subjectLabel="Website Content" clientId={state.clientId} />;
}

export default function App() {
  return (
    <ContentProvider>
      <div className="op-paper min-h-screen pb-20">
        <HeaderWithClient />
        <PrefillBoot />
        <Wizard />
      </div>
    </ContentProvider>
  );
}
