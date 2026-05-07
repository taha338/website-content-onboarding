/**
 * ContentContext — single source of truth for Form 3 (Website Content).
 *
 * Schema mirrors `clickup_custom_fields_to_create.xlsx` Sheet 4 plus
 * the existing 163 fields in the Website Content Form ClickUp list.
 * Subject Type drives candidate vs party conditional logic.
 */
import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const initial = {
  // Boot
  clientId: '',
  clickupTaskId: '',
  prefillStatus: 'idle',
  prefillError: '',

  // Per-item opt-ins for sections that mirror the Wix form's checkbox
  // gating (1.4 service, 1.5 personal, 4 endorsements, 5.1 photos,
  // 5.2 video, 6 social handles). When false, the corresponding fields
  // are hidden and not required.
  optIns: {
    // 1.4 Service & Civic Engagement
    military: false, electedOffices: false, boards: false,
    nonprofit: false, faith: false, profAssoc: false, otherExp: false,
    // 1.5 Personal / humanizing
    spouse: false, children: false, pets: false, religion: false,
    languages: false, hobbies: false, favSpot: false,
    // 4 Endorsements & Social Proof
    securedEnd: false, pursuingEnd: false, quotes: false, notableSupp: false,
    // 5.1 Required photos (each toggle = "we have this asset")
    primaryHeadshot: false, secondaryHeadshot: false, candidateWithFamily: false,
    candidateInCommunity: false, candidateWithConstituents: false,
    lifestyle: false, heroBanner: false,
    // 5.2 Video
    launchVideo: false, intro30s: false, bRoll: false, adCreative: false,
    // 6 Social Media handles
    facebook: false, instagram: false, twitter: false, tiktok: false,
    youtube: false, linkedinCandidate: false, linkedinCampaign: false,
    threads: false, bluesky: false, otherSocial: false,
  },

  // Wizard navigation
  currentStage: 0,
  completedStages: [],
  // Optional-section toggles
  optInLeadership: '',     // party only — do you want public bios?
  optInVoterRes: '',       // candidate only — do you want voter resources page?
  optInMembership: '',     // party only — public membership pages?
  optInPublicGov: '',      // party only — public bylaws / platform / constitution?

  // 1. Identity (subject type + display copy)
  subjectType: '',
  displayName: '',
  tagline: '',
  logoFiles: '',
  logoSecondary: '',

  // 2A. Candidate Biography
  bornCityState: '',
  raised: '',
  currentCity: '',
  yearsInDistrict: '',
  whatBroughtThem: '',
  education: [{ school: '', degree: '', year: '' }],
  rolesCompanies: '',
  currentOccupation: '',
  willContinueWorking: '',
  electedOfficesHeld: '',
  boardsCommissions: '',
  professionalAssociations: '',
  militaryService: '',
  nonprofitVolunteer: '',
  awardsHonors: '',
  spouseName: '',
  childrenAges: '',
  familyBios: '',
  pets: '',
  religion: '',
  hobbies: '',
  favoriteSpots: '',

  // 2B. Party Profile
  foundingYear: '',
  foundingStoryLong: '',
  foundersHistorical: [{ name: '', role: '', dates: '' }],
  missionStatement: '',
  visionStatement: '',
  // Core values: minimum 3 — pre-seed three rows; user can add more.
  coreValues: [{ value: '' }, { value: '' }, { value: '' }],
  platformPillarsFull: '',
  positionPapers: [{ title: '', summary: '', link: '' }],
  membershipNumbers: '',
  chapterDirectory: [{ name: '', region: '', contact: '', url: '' }],
  affiliatedOrgsCoalitions: '',
  notablePastWins: '',
  internalCommitteeStructure: '',

  // 2C. Leadership Profiles (party only, repeating)
  leadershipProfiles: [{
    name: '', title: '', shortBio: '', longBio: '', headshot: '',
    cityState: '', background: '', joinedYear: '', socialHandles: '', quote: '',
  }],
  pastChairs: '',

  // 3. Narrative & Messaging
  whyRunning: '',           // candidate
  whyPartyExists: '',       // party
  incitingMoment: '',       // candidate
  foundingMoment: '',       // party — narrative
  differentiationOpponent: '', // candidate
  differentiationOther: '', // party
  voterFeel: '',
  voterDo: '',
  elevatorPitch: '',

  // 4. Issues / Platform — start with 3 issues; user can add more
  // (caps at 10 so the form doesn't get unwieldy).
  issues: Array.from({ length: 3 }, () => ({
    name: '', position: '', supportingDetail: '',
    personalConnection: '',  // candidate
    partyRationale: '',      // party
    contrastOpponent: '',    // candidate
    contrastOtherParties: '',// party
  })),

  // 5. Record & Receipts
  topVotesHighlight: '',          // candidate
  votesAttackedPreempt: '',       // candidate
  partyLegislativeWins: '',       // party
  pastEndorsementsByParty: '',    // party
  securedEndorsements: '',
  notableSupporters: '',          // both, capped at 10 (UI hint)
  personalEndorsements: '',       // candidate

  // 6. Risk / Legal
  topicsAvoid: '',
  topicsLegalReview: '',
  internalDisagreements: '',      // party
  campaignCounsel: '',            // candidate
  generalCounsel: '',             // party

  // 7. Compliance / Disclosures
  paidForDisclaimer: '',
  placementRequirements: '',
  stateElectionAgency: '',
  localElectionAuthority: '',     // candidate
  applicableStatutes: '',
  fecReportingRequired: '',       // party
  canSpamFooterAddress: '',

  // 8. Data Governance
  dataRetentionPolicy: '',
  supporterDataRequests: '',
  dataSharingPublic: '',

  // 9. Endorsed Candidates (party-only, repeating)
  endorsedCandidates: [{
    name: '', office: '', state: '', year: '', photo: '', link: '',
  }],
  endorsementCriteria: '',        // party
  slateCardsUploads: '',          // party

  // 10. Events
  eventsCalendarSource: '',
  eventsCalendarOwner: '',
  hardMilestonesFromForm1: '',
  recurringEventsToFeature: '',   // party
  debateSchedule: '',             // candidate
  eventTicketingDetails: '',

  // 11. Media Library (candidate vs party blocks)
  primaryHeadshot: '',
  secondaryHeadshot: '',
  candidateWithFamily: '',
  candidateInCommunity: '',
  candidateWithConstituents: '',
  heroBannerCrop: '',
  otherCandidatePhoto: '',
  officialSeal: '',               // party
  leadershipHeadshots: '',        // party
  eventPhotos: '',                // party
  rallyConventionPhotos: '',      // party
  supporterCrowdShots: '',        // party
  photographerCreditRequired: '',
  modelReleasesOnFile: '',
  hostingPreference: '',
  bRollUploads: '',
  captioningVendor: '',
  existingPhotoLibrary: '',
  launchVideoLink: '',
  intro30sLink: '',
  adCreativeLink: '',
  pursuingEndorsements: '',
  quotesAvailable: '',
  linkedinCandidate: '',
  linkedinCampaign: '',
  threads: '',
  bluesky: '',

  // 12. Social Media
  facebook: '', instagram: '', twitter: '', youtube: '',
  tiktok: '', truthSocial: '', rumble: '', telegram: '',
  newsletterSubstack: '',
  otherSocialHandle: '',

  // 13. Inspiration & References
  websitesLikedCandidate: '',     // candidate
  websitesAvoidCandidate: '',     // candidate
  websitesLikedParty: '',         // party
  websitesAvoidParty: '',         // party
  brandGuidelinesUpload: '',

  // 14. Press / Newsroom
  pressContactName: '',
  pressContactEmail: '',
  recentPressReleases: [{ date: '', title: '', body: '', link: '' }],
  notableMediaHits: '',

  // 16. Site Compliance Pages + Translation
  privacyPolicy: '',
  termsOfService: '',
  cookieConsent: '',
  pagesRequiringTranslation: '',
  whoProvidesTranslation: '',

  // 17. Site Structure
  requiredPagesList: '',

  // 18. Email Content
  welcomeEmailContent: '',
  dripSequenceContent: '',
  emailListSegmentation: '',

  // 19. Fundraising Page
  donationTiers: '',
  recurringDonationDefault: '',
  recurringFrequency: '',
  contributionLimitDisclaimer: '',
  donorEligibilityDisclaimer: '',

  // 20. Voter Resources (candidate)
  pollingPlaceLookup: '',
  voterRegDeadline: '',
  sampleBallotLink: '',
  earlyVotingInfo: '',
  gotvPlanContent: '',

  // 21. Membership Pages (party)
  membershipTiersBenefits: '',
  howToJoinPublicCopy: '',

  // 22. Public Governance (party)
  bylawsPublic: '',
  platformDocPublic: '',
  constitutionPublic: '',
  platformVersioning: '',
  resolutionsArchive: '',

  // 23. SEO
  targetKeywords: '',

  // 24. Transactional
  thankYouPageContent: '',

  // 25. Volunteer
  volunteerCategories: '',

  // Submit state
  submitting: false,
  submitted: false,
  submitError: '',
};

const ContentContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'PREFILL':
      return { ...state, ...action.payload, prefillStatus: 'success' };
    case 'SET_PREFILL_STATUS':
      return { ...state, prefillStatus: action.payload.status, prefillError: action.payload.error || '' };
    case 'UPDATE':
      return { ...state, ...action.payload };
    case 'UPDATE_OPTIN':
      return { ...state, optIns: { ...state.optIns, ...action.payload } };
    case 'UPDATE_REPEATING':
      return {
        ...state,
        [action.field]: state[action.field].map((row, i) =>
          i === action.index ? { ...row, ...action.payload } : row
        ),
      };
    case 'ADD_REPEATING':
      return { ...state, [action.field]: [...state[action.field], action.template] };
    case 'REMOVE_REPEATING':
      return { ...state, [action.field]: state[action.field].filter((_, i) => i !== action.index) };
    case 'UPDATE_ISSUE':
      return {
        ...state,
        issues: state.issues.map((row, i) => i === action.index ? { ...row, ...action.payload } : row),
      };
    case 'SET_SUBMIT_STATE':
      return { ...state, ...action.payload };
    case 'SET_STAGE':
      return { ...state, currentStage: action.payload };
    case 'NEXT_STAGE':
      return {
        ...state,
        completedStages: [...new Set([...state.completedStages, state.currentStage])],
        currentStage: state.currentStage + 1,
      };
    case 'PREV_STAGE':
      return { ...state, currentStage: Math.max(0, state.currentStage - 1) };
    default:
      return state;
  }
}

export function ContentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const update = useCallback((payload) => dispatch({ type: 'UPDATE', payload }), []);
  const updateOptIn = useCallback((payload) => dispatch({ type: 'UPDATE_OPTIN', payload }), []);
  const updateIssue = useCallback((index, payload) => dispatch({ type: 'UPDATE_ISSUE', index, payload }), []);
  const updateRepeating = useCallback((field, index, payload) =>
    dispatch({ type: 'UPDATE_REPEATING', field, index, payload }), []);
  const addRepeating = useCallback((field, template) =>
    dispatch({ type: 'ADD_REPEATING', field, template }), []);
  const removeRepeating = useCallback((field, index) =>
    dispatch({ type: 'REMOVE_REPEATING', field, index }), []);

  const isParty = state.subjectType === 'party';
  const isCandidate = state.subjectType === 'candidate';
  const subjectChosen = isParty || isCandidate;

  const goToStage = useCallback((s) => dispatch({ type: 'SET_STAGE', payload: s }), []);
  const nextStage = useCallback(() => {
    dispatch({ type: 'NEXT_STAGE' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const prevStage = useCallback(() => {
    dispatch({ type: 'PREV_STAGE' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const value = useMemo(() => ({
    state, dispatch, update, updateOptIn, updateIssue, updateRepeating, addRepeating, removeRepeating,
    isParty, isCandidate, subjectChosen,
    goToStage, nextStage, prevStage,
  }), [state, update, updateOptIn, updateIssue, updateRepeating, addRepeating, removeRepeating, isParty, isCandidate, subjectChosen, goToStage, nextStage, prevStage]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
