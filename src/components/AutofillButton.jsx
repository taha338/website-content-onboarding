import { useEffect, useState } from 'react';
import { useContent } from '../context/ContentContext';

const isDevMode = () => {
  const params = new URLSearchParams(window.location.search);
  return ['1', 'true', 'on', 'yes'].includes((params.get('dev') || '').toLowerCase());
};

const today = () => new Date().toISOString().slice(0, 10);

function buildPayload(subjectType) {
  const displayName =
    subjectType === 'party'     ? 'Test Liberty Party' :
    subjectType === 'nonprofit' ? 'Test Liberty Foundation' :
    subjectType === 'pac'       ? 'Test Liberty PAC' :
                                  'Jane Q. Test';
  const base = {
    subjectType,
    displayName,
    tagline: 'Test Tagline — Rooted in Freedom',
    logoFiles: 'https://example.com/test-logo.png',
    logoSecondary: 'https://example.com/test-logo-mark.png',

    // Candidate Bio
    bornCityState: 'Springfield, IL',
    raised: 'Springfield, IL',
    currentCity: 'Springfield, IL',
    yearsInDistrict: '12',
    whatBroughtThem: 'Test what brought them here.',
    education: [
      { school: 'State University', degree: 'B.A. Political Science', year: '2008' },
      { school: 'Test Law School', degree: 'J.D.', year: '2011' },
    ],
    rolesCompanies: 'Test Co (2012-2018), Sample LLC (2018-present)',
    currentOccupation: 'Attorney',
    willContinueWorking: 'No',
    electedOfficesHeld: 'City Council 2018-2022',
    boardsCommissions: 'Test Library Board',
    professionalAssociations: 'State Bar Association',
    militaryService: 'None',
    nonprofitVolunteer: 'Habitat for Humanity local chapter',
    awardsHonors: 'Citizen of the Year 2021',
    spouseName: 'Pat Test',
    childrenAges: 'Sam (10), Alex (7)',
    familyBios: 'Test family bio paragraph.',
    pets: 'Two dogs: Buddy and Rex',
    religion: 'Test Faith',
    hobbies: 'Hiking, reading, woodworking',
    favoriteSpots: 'Test Diner, Springfield Park',

    // Party Profile
    foundingYear: '2019',
    foundingStoryLong: 'Test founding story paragraph that explains the origin and motivation for the party.',
    foundersHistorical: [
      { name: 'Alex Founder', role: 'Co-founder', dates: '2019-present' },
      { name: 'Jamie Co-Founder', role: 'Co-founder', dates: '2019-2022' },
    ],
    missionStatement: 'Test mission statement.',
    visionStatement: 'Test vision statement.',
    coreValues: [
      { value: 'Liberty' },
      { value: 'Accountability' },
      { value: 'Integrity' },
    ],
    platformPillarsFull: 'Pillar 1: Test. Pillar 2: Test. Pillar 3: Test.',
    positionPapers: [
      { title: 'Test Paper 1', summary: 'Summary 1', link: 'https://example.com/paper1' },
    ],
    membershipNumbers: '5,200 members across 12 chapters',
    chapterDirectory: [
      { name: 'Springfield Chapter', region: 'Central IL', contact: 'chapter@example.com', url: 'https://example.com/springfield' },
    ],
    affiliatedOrgsCoalitions: 'Test Coalition for Local Liberty',
    notablePastWins: '2022 city council race; 2023 ballot measure',
    internalCommitteeStructure: 'Executive Committee, Policy Committee, Finance Committee',

    // Leadership Profiles (party)
    leadershipProfiles: [{
      name: 'Pat Leader',
      title: 'Chair',
      shortBio: 'Test short bio sentence.',
      longBio: 'Test long bio paragraph with more detail about background and experience.',
      headshot: 'https://example.com/leader.jpg',
      cityState: 'Springfield, IL',
      background: 'Background details',
      joinedYear: '2020',
      socialHandles: '@patleader',
      quote: 'Test inspiring quote.',
    }],
    pastChairs: 'Pat Chair 2019-2021; Sam Chair 2021-2023',

    // Narrative
    whyRunning: 'Test reason for running for office.',
    whyPartyExists: 'Test reason this party exists.',
    incitingMoment: 'Test inciting moment that started it.',
    foundingMoment: 'Test founding moment narrative.',
    differentiationOpponent: 'Test differentiation from opponent.',
    differentiationOther: 'Test differentiation from other parties.',
    voterFeel: 'Hopeful, empowered, heard.',
    voterDo: 'Vote, volunteer, donate.',
    elevatorPitch: 'Test 30-second elevator pitch.',

    // Issues
    issues: [
      { name: 'Education', position: 'Test position', supportingDetail: 'Test detail', personalConnection: 'Test connection', partyRationale: 'Test rationale', nonprofitRationale: 'Test nonprofit rationale', pacRationale: 'Test PAC strategic rationale', contrastOpponent: 'Test contrast', contrastOtherParties: 'Test contrast', contrastPeerOrgs: 'Test contrast vs peer orgs', contrastPeerPacs: 'Test contrast vs peer PACs' },
      { name: 'Healthcare', position: 'Test position', supportingDetail: 'Test detail', personalConnection: 'Test connection', partyRationale: 'Test rationale', nonprofitRationale: 'Test nonprofit rationale', pacRationale: 'Test PAC strategic rationale', contrastOpponent: 'Test contrast', contrastOtherParties: 'Test contrast', contrastPeerOrgs: 'Test contrast vs peer orgs', contrastPeerPacs: 'Test contrast vs peer PACs' },
      { name: 'Economy', position: 'Test position', supportingDetail: 'Test detail', personalConnection: 'Test connection', partyRationale: 'Test rationale', nonprofitRationale: 'Test nonprofit rationale', pacRationale: 'Test PAC strategic rationale', contrastOpponent: 'Test contrast', contrastOtherParties: 'Test contrast', contrastPeerOrgs: 'Test contrast vs peer orgs', contrastPeerPacs: 'Test contrast vs peer PACs' },
    ],

    // Record & Receipts
    topVotesHighlight: 'HB 123 (yes); SB 456 (no)',
    votesAttackedPreempt: 'HB 789 — context: Test',
    partyLegislativeWins: 'Wins list test',
    pastEndorsementsByParty: 'Past endorsements list test',
    securedEndorsements: 'Local Firefighters Union; County Teachers Association',
    notableSupporters: 'Mayor Test; Senator Sample',
    personalEndorsements: 'Friend Endorser; Colleague Endorser',

    // Risk / Legal
    topicsAvoid: 'Test topics to avoid',
    topicsLegalReview: 'Test topics requiring legal review',
    internalDisagreements: 'Test internal disagreements',
    campaignCounsel: 'Test Campaign Counsel LLC',
    generalCounsel: 'Test General Counsel LLC',

    // Compliance
    paidForDisclaimer: 'Paid for by Test Committee',
    placementRequirements: 'Footer of every page',
    stateElectionAgency: 'Illinois State Board of Elections',
    localElectionAuthority: 'Sangamon County Clerk',
    applicableStatutes: '10 ILCS 5/9',
    fecReportingRequired: 'No',
    canSpamFooterAddress: '123 Test Lane, Springfield, IL 62701',

    // Data Governance
    dataRetentionPolicy: 'Retain supporter data for 7 years per IRS guidance.',
    supporterDataRequests: 'data@example.com',
    dataSharingPublic: 'No third-party sharing.',

    // Endorsed Candidates (party)
    endorsedCandidates: [{
      name: 'Test Endorsee',
      office: 'State Senate',
      state: 'IL',
      year: '2026',
      photo: 'https://example.com/endorsee.jpg',
      link: 'https://example.com/endorsee',
    }],
    endorsementCriteria: 'Test endorsement criteria.',
    slateCardsUploads: 'https://example.com/slate-card.pdf',

    // Events
    eventsCalendarSource: 'Google Calendar',
    eventsCalendarOwner: 'events@example.com',
    hardMilestonesFromForm1: 'Filing deadline 2026-03-15',
    recurringEventsToFeature: 'Monthly town hall, weekly volunteer meet',
    debateSchedule: 'Oct 12, 2026 — Test Civic Center',
    eventTicketingDetails: 'Free, RSVP via website',

    // Media
    primaryHeadshot: 'https://example.com/headshot.jpg',
    secondaryHeadshot: 'https://example.com/headshot-2.jpg',
    candidateWithFamily: 'https://example.com/family.jpg',
    candidateInCommunity: 'https://example.com/community.jpg',
    candidateWithConstituents: 'https://example.com/constituents.jpg',
    heroBannerCrop: 'https://example.com/hero.jpg',
    otherCandidatePhoto: 'https://example.com/other.jpg',
    officialSeal: 'https://example.com/seal.png',
    leadershipHeadshots: 'https://example.com/leadership.zip',
    eventPhotos: 'https://example.com/events.zip',
    rallyConventionPhotos: 'https://example.com/rally.zip',
    supporterCrowdShots: 'https://example.com/crowd.zip',
    photographerCreditRequired: 'Yes — Test Photographer',
    modelReleasesOnFile: 'Yes',
    hostingPreference: 'Self-host on Vercel CDN',
    bRollUploads: 'https://example.com/broll.zip',
    captioningVendor: 'Rev.com',
    existingPhotoLibrary: 'https://example.com/library',

    // Social
    facebook: 'https://facebook.com/testcampaign',
    instagram: '@testcampaign',
    twitter: '@testcampaign',
    youtube: 'https://youtube.com/@testcampaign',
    tiktok: '@testcampaign',
    truthSocial: '@testcampaign',
    rumble: 'testcampaign',
    telegram: 't.me/testcampaign',
    newsletterSubstack: 'testcampaign.substack.com',
    otherSocialHandle: 'Mastodon: @testcampaign',

    // Inspiration
    websitesLikedCandidate: 'https://example.com/liked-1, https://example.com/liked-2',
    websitesAvoidCandidate: 'https://example.com/avoid-1',
    websitesLikedParty: 'https://example.com/party-liked',
    websitesAvoidParty: 'https://example.com/party-avoid',
    brandGuidelinesUpload: 'https://example.com/brand-guidelines.pdf',

    // Press
    pressContactName: 'Press Test Person',
    pressContactEmail: 'press@example.com',
    recentPressReleases: [{
      date: today(),
      title: 'Test Release Title',
      body: 'Test press release body paragraph.',
      link: 'https://example.com/press-1',
    }],
    notableMediaHits: 'Local Tribune profile (2025); WTSP interview (2024)',

    // Site Compliance
    privacyPolicy: 'https://example.com/privacy',
    termsOfService: 'https://example.com/terms',
    cookieConsent: 'Yes — banner required',
    pagesRequiringTranslation: 'Home, About, Issues',
    whoProvidesTranslation: 'Internal volunteer team',

    // Site Structure
    requiredPagesList: 'Home, About, Issues, Endorsements, Events, Donate, Contact, Volunteer',

    // Email
    welcomeEmailContent: 'Welcome to Test! We\'re glad you joined.',
    dripSequenceContent: 'Day 1: thanks. Day 3: issues. Day 7: volunteer.',
    emailListSegmentation: 'Donors, Volunteers, Press, General',

    // Fundraising
    donationTiers: '$25, $50, $100, $250, $500, $1000',
    recurringDonationDefault: 'Monthly',
    recurringFrequency: 'Monthly',
    contributionLimitDisclaimer: 'Federal law prohibits contributions over $X.',
    donorEligibilityDisclaimer: 'Must be US citizen or permanent resident.',

    // Voter Resources (candidate)
    pollingPlaceLookup: 'https://example.com/polling',
    voterRegDeadline: '2026-10-08',
    sampleBallotLink: 'https://example.com/ballot',
    earlyVotingInfo: 'Early voting Oct 14 - Nov 1',
    gotvPlanContent: 'Test GOTV plan content.',

    // Membership Pages (party)
    membershipTiersBenefits: 'Free, Supporter $25/yr, Patron $100/yr',
    howToJoinPublicCopy: 'Sign up via the join form. Confirm email. Done.',

    // Public Governance (party)
    bylawsPublic: 'https://example.com/bylaws.pdf',
    platformDocPublic: 'https://example.com/platform.pdf',
    constitutionPublic: 'https://example.com/constitution.pdf',
    platformVersioning: 'v2.1, ratified 2025-06-01',
    resolutionsArchive: 'https://example.com/resolutions',

    // SEO
    targetKeywords: 'test campaign, test candidate, illinois liberty',

    // Transactional
    thankYouPageContent: 'Thank you for your support! We\'ll be in touch.',

    // Volunteer
    volunteerCategories: 'Door-knocking, phone banking, events, data entry',

    // ─── Nonprofit Profile (S2D) ───
    npFoundingYear: '2015',
    npFoundingStory: 'Test nonprofit founding story — community need that catalyzed the org.',
    npMissionStatement: 'Test nonprofit mission statement.',
    npVisionStatement: 'Test nonprofit vision statement.',
    npCoreValues: [
      { value: 'Integrity' },
      { value: 'Impact' },
      { value: 'Community' },
    ],
    npProgramAreas: 'Program 1: Test service. Program 2: Test advocacy. Program 3: Test research.',
    npPositionBriefs: [
      { title: 'Test Brief 1', summary: 'Brief summary', link: 'https://example.com/brief1' },
    ],
    npImpactMetrics: 'Served 12,000 families in 2025; trained 400 volunteers.',
    npAnnualBudget: '$2.4M (2025)',
    npTopFunders: 'Test Family Foundation; Anonymous donors',
    npChapterDirectory: [
      { name: 'Test City Chapter', region: 'Midwest', contact: 'chapter@example.org', url: 'https://example.org/midwest' },
    ],
    npCoalitionPartners: 'Test Coalition; Allied Nonprofit Alliance',
    npNotablePastWins: '2024 ballot initiative passage; 2023 state grant award',
    npBoardStructure: '9 board seats; Executive, Finance, and Programs committees',
    npIrsDeterminationStatus: 'Determined',
    npLobbyingActivity: 'Limited (within IRS thresholds)',
    np501hElection: 'No',
    npSisterOrg: 'Test Liberty Action Fund (c4)',
    npFiscalSponsor: '',

    // ─── PAC Profile (S2E) ───
    pacFoundingYear: '2020',
    pacFecCommitteeId: 'C00999999',
    pacMissionStatement: 'Test PAC mission statement.',
    pacIssueFocus: 'Test issue focus paragraph.',
    pacCoreValues: [
      { value: 'Liberty' },
      { value: 'Accountability' },
      { value: 'Constitutional Fidelity' },
    ],
    pacPrimaryActivity: 'Direct contributions + IE',
    pacFecFilingFrequency: 'Quarterly',
    pacFecRegistrationStatus: 'Registered',
    pacIeOnly: 'No',
    pacSponsoringOrg: '',
    pacAffiliatedCommittees: 'Test Affiliated PAC',
    pacSupportedCausesNarrative: 'Test narrative on supported causes.',
    pacNotableWins: '2024: 7 of 10 supported candidates won.',

    // ─── Narrative additions ───
    whyNonprofitExists: 'Test reason this nonprofit exists.',
    whyPacExists: 'Test reason this PAC exists.',
    npFoundingMoment: 'Test nonprofit founding moment narrative.',
    pacFoundingMoment: 'Test PAC founding moment narrative.',
    npDifferentiation: 'Test differentiation vs peer organizations.',
    pacDifferentiation: 'Test differentiation vs peer PACs.',

    // ─── Record additions ───
    npImpactWins: 'Test top program / policy victories with measurable outcomes.',
    npPastGrantsAwarded: 'Test major grant: $250K from Test Foundation (2024)',
    pacElectoralWins: 'Test electoral wins — supported candidates who won.',
    pacIeExpenditures: '2024 IE in IL-13: $180K, candidate won.',
    pacContributionsHighlight: 'Direct contributions to 22 candidates in 2024 cycle.',

    // ─── Compliance additions ───
    stateCharityAgency: 'Illinois Attorney General — Charitable Trust Bureau',
    charitableRegistrationStates: 'IL, IN, MI, WI',
    taxDeductibilityDisclaimer: 'Contributions are tax-deductible to the extent permitted by law. EIN: 12-3456789.',
    irsForm990Link: 'https://example.org/990-2024.pdf',
    pacAuthorizationDisclaimer: 'Paid for by Test Liberty PAC. Not authorized by any candidate or candidate\'s committee.',
    ieDisclaimer: 'This communication is an independent expenditure not authorized by any candidate or candidate\'s committee.',
    prohibitedContributors: 'Cannot accept contributions from foreign nationals or federal contractors.',

    // ─── Inspiration additions ───
    websitesLikedNonprofit: 'https://example.org/nonprofit-liked',
    websitesAvoidNonprofit: 'https://example.org/nonprofit-avoid',
    websitesLikedPac: 'https://example.com/pac-liked',
    websitesAvoidPac: 'https://example.com/pac-avoid',

    // Opt-in toggles — flip on so optional sections render in PDF
    optInLeadership: ['party', 'nonprofit', 'pac'].includes(subjectType) ? 'yes' : '',
    optInVoterRes: subjectType === 'candidate' ? 'yes' : '',
    optInMembership: ['party', 'nonprofit'].includes(subjectType) ? 'yes' : '',
    optInPublicGov: ['party', 'nonprofit'].includes(subjectType) ? 'yes' : '',
  };
  return base;
}

export default function AutofillButton() {
  const { state, dispatch } = useContent();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => { setEnabled(isDevMode()); }, []);

  if (!enabled) return null;

  const fill = (subjectType) => {
    dispatch({ type: 'PREFILL', payload: buildPayload(subjectType) });
    setToast(`✓ Autofilled (${subjectType})`);
    setTimeout(() => setToast(''), 2000);
  };

  const handleClick = () => {
    const params = new URLSearchParams(window.location.search);
    const urlSubject = (params.get('subject') || '').toLowerCase();
    const ALLOWED = ['candidate', 'party', 'nonprofit', 'pac'];
    if (ALLOWED.includes(urlSubject)) {
      fill(urlSubject);
      return;
    }
    if (ALLOWED.includes(state.subjectType)) {
      fill(state.subjectType);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Fill all form fields with test data (dev mode only)"
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 9999,
          background: '#7c3aed', color: '#fff', border: 'none',
          padding: '8px 14px', borderRadius: 8, fontSize: 12,
          fontWeight: 700, letterSpacing: '0.05em',
          textTransform: 'uppercase', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        🧪 Autofill (Test)
      </button>

      {toast && (
        <div style={{
          position: 'fixed', top: 56, right: 12, zIndex: 9999,
          background: '#10b981', color: '#fff',
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{toast}</div>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: 24, minWidth: 320,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#111' }}>
              Autofill: subject type?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => { setOpen(false); fill('candidate'); }}
                style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #1C2E5B', background: '#1C2E5B', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >Candidate</button>
              <button
                type="button"
                onClick={() => { setOpen(false); fill('party'); }}
                style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #B22234', background: '#B22234', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >Party</button>
              <button
                type="button"
                onClick={() => { setOpen(false); fill('nonprofit'); }}
                style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #0F766E', background: '#0F766E', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >Nonprofit</button>
              <button
                type="button"
                onClick={() => { setOpen(false); fill('pac'); }}
                style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #7C3AED', background: '#7C3AED', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >PAC</button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ marginTop: 12, padding: '8px', width: '100%', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13 }}
            >Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
