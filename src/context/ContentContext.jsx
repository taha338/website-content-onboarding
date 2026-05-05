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
  coreValues: [{ value: '' }],
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

  // 4. Issues / Platform — 5 issues × multiple fields
  issues: Array.from({ length: 5 }, () => ({
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
    state, dispatch, update, updateIssue, updateRepeating, addRepeating, removeRepeating,
    isParty, isCandidate, subjectChosen,
    goToStage, nextStage, prevStage,
  }), [state, update, updateIssue, updateRepeating, addRepeating, removeRepeating, isParty, isCandidate, subjectChosen, goToStage, nextStage, prevStage]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
