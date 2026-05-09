/**
 * Form 3 — Website Content (Operation 1776)
 *
 * Multi-stage wizard mirroring Form 1 / Brand Discovery patterns:
 * 8 stages, framer-motion transitions, prev/next, required-field
 * validation, "do you need this?" gates for optional content groups.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ContentProvider, useContent } from './context/ContentContext';
import { fetchPrefill, readClientIdFromUrl } from './lib/clickup';
import { generateReportPDF } from './utils/generateReportPDF';
import ContentReportTemplate from './components/ContentReportTemplate';
import { Download } from 'lucide-react';
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

// ─── Required-field validators ─────────────────────────────────────────
// Each stage must satisfy its predicate before "Continue" enables. Mirrors
// the canContinue pattern in Form 1/2. Keep these aligned with the
// "no asterisk = required" convention used in src/components/sections.

const filled = (v) => typeof v === 'string' ? v.trim().length > 0 : !!v;
// "Filled if visible" — when an opt-in toggle is OFF, the dependent
// field is not required. Used to enforce conditional requireds.
const filledIf = (visible, v) => !visible || filled(v);

function validateStage1(s) {
  return Boolean(s.subjectType) && filled(s.displayName);
}
function validateStage2(s, isCandidate, isParty) {
  if (isCandidate) {
    const eduOk = Array.isArray(s.education)
      && s.education.some((r) => filled(r?.school));
    const o = s.optIns || {};
    return filled(s.bornCityState) &&
           filled(s.currentCity) &&
           filled(s.yearsInDistrict) &&
           eduOk &&
           filled(s.rolesCompanies) &&
           filled(s.currentOccupation) &&
           filled(s.willContinueWorking) &&
           // 1.4 conditional requireds: only if the section toggle is on
           filledIf(o.electedOffices,  s.electedOfficesHeld) &&
           filledIf(o.boards,          s.boardsCommissions) &&
           filledIf(o.nonprofit,       s.nonprofitVolunteer) &&
           filledIf(o.faith,           s.religion);
  }
  if (isParty) {
    const coreOk = Array.isArray(s.coreValues) &&
      s.coreValues.filter((r) => filled(r?.value)).length >= 3;
    return filled(s.foundingYear) && filled(s.missionStatement) &&
           filled(s.visionStatement) && coreOk &&
           filled(s.platformPillarsFull);
  }
  return false;
}
function validateStage3(s, isCandidate, isParty) {
  if (isCandidate) {
    return filled(s.whyRunning) &&
           filled(s.incitingMoment) &&
           filled(s.differentiationOpponent) &&
           filled(s.voterFeel) &&
           filled(s.voterDo) &&
           filled(s.tagline) &&
           filled(s.elevatorPitch);
  }
  if (isParty) {
    return filled(s.whyPartyExists) &&
           filled(s.foundingMoment) &&
           filled(s.differentiationOther) &&
           filled(s.voterFeel) &&
           filled(s.voterDo) &&
           filled(s.tagline) &&
           filled(s.elevatorPitch);
  }
  return false;
}
function validateStage4(s) {
  // First 3 issues must each have all 5 core fields per the Wix spec.
  const issues = Array.isArray(s.issues) ? s.issues : [];
  if (issues.length < 3) return false;
  return issues.slice(0, 3).every((i) =>
    filled(i?.name) &&
    filled(i?.position) &&
    filled(i?.supportingDetail) &&
    filled(i?.personalConnection) &&
    filled(i?.contrastOpponent),
  );
}
function validateStage5(s, isCandidate) {
  // 3.6 Third Rails always required; 3.7 Voting record required for incumbents.
  if (!filled(s.topicsAvoid) || !filled(s.topicsLegalReview)) return false;
  if (isCandidate && s.electedOfficesHeld && filled(s.electedOfficesHeld)) {
    // Treat presence of prior office text as "incumbent / has record"
    if (!filled(s.topVotesHighlight) || !filled(s.votesAttackedPreempt)) return false;
  }
  return true;
}
function validateStage6(s, isCandidate, isParty) {
  if (!filled(s.dataRetentionPolicy)) return false;
  if (!filled(s.supporterDataRequests)) return false;
  if (isParty && !filled(s.endorsementCriteria)) return false;
  return true;
}
function validateStage7(s, isCandidate) {
  // Press contact + events calendar + inspiration websites
  if (!filled(s.pressContactName) || !filled(s.pressContactEmail)) return false;
  if (!filled(s.eventsCalendarSource) || !filled(s.eventsCalendarOwner)) return false;
  if (isCandidate) {
    return filled(s.websitesLikedCandidate) && filled(s.websitesAvoidCandidate);
  }
  return filled(s.websitesLikedParty) && filled(s.websitesAvoidParty);
}
function validateStage8(s, isCandidate) {
  if (!filled(s.privacyPolicy) || !filled(s.termsOfService) ||
      !filled(s.cookieConsent) || !filled(s.requiredPagesList)) return false;
  // Compliance / paid-for disclaimer block
  if (!filled(s.paidForDisclaimer) || !filled(s.stateElectionAgency) ||
      !filled(s.campaignCounsel)) return false;
  if (isCandidate && !filled(s.localElectionAuthority)) return false;
  return true;
}

function Stage1Identity() {
  const { state } = useContent();
  const canContinue = validateStage1(state);
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
  const { state, isCandidate, isParty } = useContent();
  const canContinue = validateStage2(state, isCandidate, isParty);
  return (
    <StageShell number={2} title={isCandidate ? 'Biography' : 'Party Profile'} subtitle={isCandidate ? 'Where the candidate comes from, and who they are.' : 'Founding, mission, structure.'} canContinue={canContinue}>
      <S2ACandidateBio />
      <S2BPartyProfile />
      {isParty && <S2CLeadership />}
    </StageShell>
  );
}

function Stage3Narrative() {
  const { state, isCandidate, isParty } = useContent();
  const canContinue = validateStage3(state, isCandidate, isParty);
  return (
    <StageShell number={3} title="Narrative & Messaging" subtitle="The story you tell on the homepage and 'about' pages." canContinue={canContinue}>
      <S3Narrative />
    </StageShell>
  );
}

function Stage4Issues() {
  const { state } = useContent();
  const canContinue = validateStage4(state);
  return (
    <StageShell number={4} title="Issues / Platform" subtitle="Up to 5 issues. Names pre-fill from Form 2 priorities/pillars." canContinue={canContinue}>
      <S4Issues />
    </StageShell>
  );
}

function Stage5Record() {
  const { state, isCandidate } = useContent();
  const canContinue = validateStage5(state, isCandidate);
  return (
    <StageShell number={5} title="Record, Risk & Compliance" subtitle="Receipts and disclosures." canContinue={canContinue}>
      <S5Record />
      <S6RiskLegal />
      <S7Compliance />
    </StageShell>
  );
}

function Stage6Compliance() {
  const { state, isCandidate, isParty } = useContent();
  const canContinue = validateStage6(state, isCandidate, isParty);
  return (
    <StageShell number={6} title="Data Governance & Endorsements" canContinue={canContinue}>
      <S8DataGov />
      {isParty && <S9Endorsed />}
    </StageShell>
  );
}

function Stage7MediaSocial() {
  const { state, isCandidate } = useContent();
  const canContinue = validateStage7(state, isCandidate);
  return (
    <StageShell number={7} title="Events, Media & Social" subtitle="Calendar, photos, video, and every social handle you have." canContinue={canContinue}>
      <S10Events />
      <S11Media />
      <S12Social />
      <S13Inspiration />
      <S14Press />
    </StageShell>
  );
}

function Stage8SitePages() {
  const { state, isCandidate, isParty } = useContent();
  const canContinue = validateStage8(state, isCandidate);
  return (
    <StageShell number={8} title="Site Pages & Content" subtitle="Compliance pages, structure, email content, fundraising, and subject-specific extras." canContinue={canContinue}>
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
  const pdfRef = useRef(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    setPdfError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      if (!pdfRef.current) throw new Error('Report preview not ready — try again.');
      const fileName = `${state.clientId || 'website-content'}-summary.pdf`;
      await generateReportPDF(pdfRef.current, fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfError(err?.message || 'Failed to generate PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

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
      <div className="p-6 rounded-2xl border border-[var(--color-op-line)] bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={state.submitting}
          className="font-display tracking-widest px-8 py-4 rounded-lg bg-[var(--color-op-red)] text-white uppercase text-lg shadow-lg hover:bg-[var(--color-op-red-deep)] disabled:bg-[var(--color-op-muted)] transition-colors"
        >
          {state.submitting ? 'Submitting…' : 'Submit Content'}
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={pdfGenerating}
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-white border border-[var(--color-op-ink)] text-[var(--color-op-ink)] font-semibold uppercase tracking-wider text-sm hover:bg-[var(--color-op-cream)] disabled:opacity-60 transition-colors"
        >
          <Download size={16} /> {pdfGenerating ? 'Generating…' : 'Download as PDF'}
        </button>
      </div>
      {pdfError && (
        <p className="mt-3 text-sm text-red-700">{pdfError}</p>
      )}
      {state.submitError && (
        <p className="mt-3 text-sm text-red-700">{state.submitError}</p>
      )}

      {/* Off-screen report template — source DOM for the PDF capture. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1100 }}>
          <div ref={pdfRef}>
            <ContentReportTemplate state={state} />
          </div>
        </div>
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
        const brand    = data.brand    || {};
        const campaign = data.campaign || {};
        dispatch({
          type: 'PREFILL',
          payload: {
            clickupTaskId: data.taskId || '',
            // Active Clients master
            displayName:    data.tradeName || campaign.displayName || '',
            subjectType:    data.subjectType || brand.subject_type || '',
            primaryName:    data.contact?.name  || '',
            primaryEmail:   data.contact?.email || '',
            primaryPhone:   data.contact?.phone || '',
            // Form 1 (campaign_intakes)
            ...(campaign.voiceTone      ? { voiceTone:      campaign.voiceTone } : {}),
            ...(campaign.voiceToneNotes ? { voiceToneNotes: campaign.voiceToneNotes } : {}),
            ...(campaign.primaryDomain  ? { primaryDomain:  campaign.primaryDomain } : {}),
            ...(campaign.campaignSlogan ? { tagline:        campaign.campaignSlogan } : {}),
            // Form 2 (brand_submissions)
            ...(brand.existing_logo_url ? { existingLogoUrl: brand.existing_logo_url } : {}),
            ...(brand.brand_core        ? { brandCore:       brand.brand_core } : {}),
            ...(brand.color_primary     ? { colorPrimary:    brand.color_primary } : {}),
            ...(brand.color_secondary   ? { colorSecondary:  brand.color_secondary } : {}),
            ...(brand.color_accent      ? { colorAccent:     brand.color_accent } : {}),
            ...(brand.color_background  ? { colorBackground: brand.color_background } : {}),
            ...(brand.color_text        ? { colorText:       brand.color_text } : {}),
            ...(brand.color_highlight   ? { colorHighlight:  brand.color_highlight } : {}),
            ...(brand.font_heading      ? { fontHeading:     brand.font_heading } : {}),
            ...(brand.font_body         ? { fontBody:        brand.font_body } : {}),
            ...(brand.candidate_name    ? { candidateName:   brand.candidate_name } : {}),
            ...(brand.candidate_office  ? { officeRunning:   brand.candidate_office } : {}),
            ...(brand.party_name        ? { partyName:       brand.party_name } : {}),
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
