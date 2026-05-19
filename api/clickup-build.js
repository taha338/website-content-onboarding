/**
 * Build ClickUp custom_fields[] for the Website Content Form list from
 * `state`. Mirrors the campaign-intake pattern. Drop-downs go in as
 * orderindex INTEGERS, dates as epoch ms, attachments are skipped.
 */

import { FIELD_IDS, FIELD_TYPES, PRIMARY_LIST_ID } from './clickup-field-map.js';

const empty = (v) =>
  v === undefined || v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

function stripEmptyRows(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter((row) => row && typeof row === 'object'
    && Object.values(row).some((v) => v !== '' && v !== null && v !== undefined));
}

// formStateKey → ClickUp field name (83 candidate-side keys + party JSON
// blocks). All 88 fields just created in the Website Content list are
// covered here; remaining state keys use the Form 3 Full Payload (JSON)
// catch-all (handled in buildCustomFields below).
export const STATE_TO_FIELD = {
  adCreativeLink:                'Ad creative — folder link',
  // alternateTaglines: removed — no form UI input currently writes this key,
  // so it was always silently absent. Re-add when a tagline-variants input
  // is added to the form.
  applicableStatutes:            'Applicable disclosure statutes',
  awardsHonors:                  'Awards, honors, notable press hits',
  bRollUploads:                  'B-Roll — folder link',
  bluesky:                       'Bluesky',
  boardsCommissions:             'Boards and commissions',
  bornCityState:                 'Born (city, state)',
  campaignCounsel:               'Campaign counsel — name & contact',
  canSpamFooterAddress:          'CAN-SPAM footer address',
  candidateInCommunity:          'Candidate in community — link',
  candidateWithConstituents:     'Candidate with constituents — link',
  candidateWithFamily:           'Candidate with family — link',
  captioningVendor:              'Captioning vendor',
  childrenAges:                  "Children's names and ages",
  currentCity:                   'Current city / town',
  currentOccupation:             'Current occupation / title',
  dataSharingPublic:             'Data-sharing agreements (public)',
  debateSchedule:                'Debate schedule + watch-party content',
  differentiationOpponent:       'Differentiation vs. opponent',
  displayName:                   'Display name on site',
  education:                     'Education (JSON)',
  electedOfficesHeld:            'Elected / appointed offices held',
  elevatorPitch:                 '30-second elevator pitch',
  eventsCalendarOwner:           'Events Calendar Owner',
  eventsCalendarSource:          'Events calendar source',
  facebook:                      'Facebook page URL',
  familyBios:                    'Family bios — quotes / role in campaign',
  favoriteSpots:                 'Favorite Local Spots',
  generalCounsel:                'General counsel — name & contact',
  heroBannerCrop:                'Hero / banner crop — link',
  hobbies:                       'Hobbies / Interests',
  hostingPreference:             'Hosting preference (video)',
  incitingMoment:                'The inciting moment',
  instagram:                     'Instagram',
  internalDisagreements:         'Internal disagreements / factions (private)',
  intro30sLink:                  '30–60 second direct-to-camera intro — link',
  launchVideoLink:               'Launch video — link',
  linkedinCampaign:              'LinkedIn (campaign)',
  linkedinCandidate:             'LinkedIn (candidate)',
  localElectionAuthority:        'Local election authority',
  logoFiles:                     'Logo files — link',
  logoSecondary:                 'Logo secondary / mark variant — link',
  militaryService:               'Military service',
  modelReleasesOnFile:           'Model releases on file?',
  nonprofitVolunteer:            'Nonprofit / volunteer work',
  notableMediaHits:              'Notable media hits',
  notableSupporters:             'Notable supporters (non-endorsement)',
  otherCandidatePhoto:           'Lifestyle / environmental shot — link',
  otherSocialHandle:             'Other social handle',
  paidForDisclaimer:             'Paid-for disclaimer — exact wording',
  personalEndorsements:          'Personal endorsements',
  pets:                          'Pets',
  photographerCreditRequired:    'Photographer credit required?',
  placementRequirements:         'Placement requirements (disclaimer)',
  pressContactEmail:             'Press contact email',
  pressContactName:              'Press contact name',
  primaryHeadshot:               'Primary headshot — link',
  professionalAssociations:      'Professional associations',
  pursuingEndorsements:          'Pursuing / pending endorsements',
  quotesAvailable:               'Quotes available for use',
  raised:                        'Raised',
  religion:                      'Religion / faith',
  rolesCompanies:                'Roles, companies, years (most recent first)',
  secondaryHeadshot:             'Secondary headshot — link',
  securedEndorsements:           'Secured endorsements',
  spouseName:                    'Spouse / partner name',
  stateElectionAgency:           'State election agency',
  supporterDataRequests:         'Supporter data request handling',
  tagline:                       'Working campaign slogan / tagline',
  targetKeywords:                'Target SEO keywords',
  thankYouPageContent:           'Thank-you page content',
  threads:                       'Threads',
  tiktok:                        'TikTok',
  topVotesHighlight:             'Top 5 votes to highlight',
  topicsAvoid:                   'Topics to avoid entirely',
  topicsLegalReview:             'Topics requiring legal/compliance review',
  twitter:                       'X / Twitter',
  volunteerCategories:           'Volunteer categories',
  voterDo:                       'What do you want them to DO?',
  voterFeel:                     'What do you want a voter to feel?',
  votesAttackedPreempt:          'Votes likely to be attacked — preempt strategy',
  websitesAvoidCandidate:        'Three websites to avoid',
  websitesLikedCandidate:        'Three websites the candidate likes',
  whatBroughtThem:               'What brought them?',
  whyRunning:                    'Why are you running?',
  willContinueWorking:           'Will candidate continue working during the race?',
  yearsInDistrict:               'Years in the district',
  youtube:                       'YouTube',
  // Compliance — created post-hoc once gap audit found it
  dataRetentionPolicy:           'Data retention policy',
  // Party-side websites reuse the candidate fields (subject-conditional —
  // only one path is filled per submission)
  websitesLikedParty:            'Three websites the candidate likes',
  websitesAvoidParty:            'Three websites to avoid',

  // 2B Party Profile
  foundingYear:                 'Founding Year (display)',
  foundingStoryLong:            'Founding Story — long form',
  missionStatement:             'Mission Statement',
  visionStatement:              'Vision Statement',
  platformPillarsFull:          'Platform Pillars — full descriptions',
  membershipNumbers:            'Membership Numbers / Reach',
  affiliatedOrgsCoalitions:     'Affiliated Organizations / Coalitions',
  notablePastWins:              'Notable Past Wins / Milestones',
  internalCommitteeStructure:   'Internal Committee Structure (public)',
  pastChairs:                   'Past Chairs / Leadership History',

  // 3 Narrative
  whyPartyExists:               'Why does the party exist?',
  foundingMoment:               'Founding moment / catalyst',
  differentiationOther:         'Differentiation vs. other parties / status quo',

  // 5 Record / Receipts
  partyLegislativeWins:         'Top 5 legislative wins / policy victories supported',
  pastEndorsementsByParty:      'Past endorsements made by the party',

  // 6 Risk / Legal
  internalDisagreements:        'Internal disagreements / factions to handle carefully',

  // 7 Compliance
  fecReportingRequired:         'FEC reporting required?',

  // 9 Endorsements
  endorsementCriteria:          'Endorsement criteria / process',

  // 10 Events
  recurringEventsToFeature:     'Recurring events to feature',
  eventTicketingDetails:        'Event ticketing / RSVP details',

  // 11 Media library (URLs)
  leadershipHeadshots:          'Leadership headshots — folder link',
  eventPhotos:                  'Event photos — folder link',
  rallyConventionPhotos:        'Rally / convention photos — folder link',
  supporterCrowdShots:          'Supporter / crowd shots — folder link',
  existingPhotoLibrary:         'Existing photo library — Drive / Dropbox link',

  // 12 Social
  truthSocial:                  'Truth Social',
  rumble:                       'Rumble',
  telegram:                     'Telegram',
  newsletterSubstack:           'Newsletter / Substack',

  // 16 Compliance pages
  privacyPolicy:                'Privacy Policy',
  termsOfService:               'Terms of Service / Site Terms',
  cookieConsent:                'Cookie consent preferences',
  pagesRequiringTranslation:    'Pages requiring translation',
  whoProvidesTranslation:       'Who provides translation?',

  // 17 Site structure
  requiredPagesList:            'Required pages list',

  // 18 Email content
  welcomeEmailContent:          'Welcome email content',
  dripSequenceContent:          'Drip sequence content',
  emailListSegmentation:        'Email list segmentation',

  // 19 Fundraising
  donationTiers:                'Suggested donation tiers',
  recurringDonationDefault:     'Recurring donation default',
  recurringFrequency:           'Recurring frequency',
  contributionLimitDisclaimer:  'Contribution-limit disclaimer text',
  donorEligibilityDisclaimer:   'Donor eligibility disclaimer text',

  // 20 Voter resources
  pollingPlaceLookup:           'Polling place lookup link',
  voterRegDeadline:             'Voter registration deadline',
  sampleBallotLink:             'Sample ballot link',
  earlyVotingInfo:              'Early voting / absentee info',
  gotvPlanContent:              'GOTV plan content',

  // 21 Membership pages
  membershipTiersBenefits:      'Membership tiers & benefits',
  howToJoinPublicCopy:          'How-to-join workflow (public copy)',

  // 22 Public governance
  bylawsPublic:                 'Bylaws (public version) — link',
  platformDocPublic:            'Platform document (public) — link',
  constitutionPublic:           'Constitution (public) — link',
  platformVersioning:           'Platform versioning',
  resolutionsArchive:           'Resolutions archive',

  // JSON repeating
  foundersHistorical:           'Founders (JSON)',
  coreValues:                   'Core Values (JSON)',
  positionPapers:               'Position Papers (JSON)',
  chapterDirectory:             'Chapter Directory (JSON)',
  leadershipProfiles:           'Leadership Profiles (JSON)',
  endorsedCandidates:           'Endorsed Candidates (JSON)',
  recentPressReleases:          'Recent Press Releases (JSON)',

  // Issues — separate compound write below in flatten step
};

const JSON_FIELDS = new Set([
  'foundersHistorical', 'coreValues', 'positionPapers',
  'chapterDirectory', 'leadershipProfiles',
  'endorsedCandidates', 'recentPressReleases',
]);

export async function getDropdownOptionsMap() {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error('CLICKUP_API_TOKEN missing');
  const r = await fetch(
    `https://api.clickup.com/api/v2/list/${PRIMARY_LIST_ID}/field`,
    { headers: { Authorization: token } },
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`ClickUp list fields ${r.status}: ${data?.err || ''}`);
  const map = {};
  for (const f of data.fields || []) {
    if (f.type === 'drop_down' || f.type === 'labels') {
      map[f.id] = f.type_config?.options || [];
    }
  }
  return map;
}

function resolveOption(raw, options) {
  if (!options || !options.length) return null;
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const target = norm(raw);
  if (!target) return null;
  const byId = options.find((o) => o.id === raw);
  if (byId) return byId.orderindex;
  const byName = options.find((o) => norm(o.name) === target);
  if (byName) return byName.orderindex;
  if (/^\d+$/.test(target)) {
    const byIdx = options.find((o) => Number(o.orderindex) === Number(target));
    if (byIdx) return byIdx.orderindex;
  }
  return null;
}

// Form fields capture freeform answers but their ClickUp counterparts are
// constrained drop_downs — map the form's text to the nearest CU option.
// Without these, resolveOption returns null and the field silently drops.
const DROPDOWN_VALUE_TRANSFORMS = {
  'Privacy Policy':       (raw) => /^https?:\/\//i.test(String(raw)) ? 'Have one'
                                  : /need|draft/i.test(String(raw))   ? 'Need draft'
                                  : /n\/?a|none|no\b/i.test(String(raw)) ? 'N/A'
                                  : 'Have one',
  'Terms of Service / Site Terms': (raw) => /^https?:\/\//i.test(String(raw)) ? 'Have one'
                                  : /need|draft/i.test(String(raw))   ? 'Need draft'
                                  : /n\/?a|none|no\b/i.test(String(raw)) ? 'N/A'
                                  : 'Have one',
  'Cookie consent preferences': (raw) => {
    const s = String(raw).toLowerCase();
    if (/gdpr/.test(s))                       return 'GDPR';
    if (/ccpa/.test(s))                       return 'CCPA';
    if (/banner|yes|required|consent/.test(s))return 'Basic banner';
    if (/none|no\b/.test(s))                  return 'None';
    return 'Basic banner';
  },
  'Hosting preference (video)': (raw) => {
    const s = String(raw).toLowerCase();
    if (/youtube/.test(s))                 return 'YouTube';
    if (/vimeo/.test(s))                   return 'Vimeo';
    if (/self[-\s]?host|vercel|s3|cdn/.test(s)) return 'Self-hosted';
    return 'Other';
  },
  'Who provides translation?': (raw) => {
    const s = String(raw).toLowerCase();
    if (/op1776|agency|us\b/.test(s))        return 'Op1776';
    if (/auto|machine|google translate/.test(s)) return 'Auto-translate';
    return 'Client'; // internal team, volunteer, in-house, etc.
  },
  'Recurring donation default': (raw) => {
    const s = String(raw).toLowerCase().trim();
    if (!s || /^(no|off|disabled|none)$/.test(s)) return 'Off';
    return 'On'; // any specified frequency means recurring is on
  },
  'Photographer credit required?': (raw) => {
    const s = String(raw).toLowerCase().trim();
    if (/^yes|required|must|credit/.test(s)) return 'Yes';
    if (/^no|none|optional/.test(s))         return 'No';
    return 'Yes';
  },
};

// url-type fields are silently rejected by ClickUp when the value isn't a
// valid URL. Form captures social platforms as bare handles (e.g.
// "@testcampaign") — prepend the canonical profile prefix per platform.
const URL_HANDLE_PREFIX = {
  'Truth Social':         (h) => `https://truthsocial.com/@${h.replace(/^@/, '')}`,
  'Rumble':               (h) => `https://rumble.com/c/${h.replace(/^@/, '')}`,
  'Instagram':            (h) => `https://instagram.com/${h.replace(/^@/, '')}`,
  'LinkedIn (candidate)': (h) => `https://linkedin.com/in/${h.replace(/^@/, '')}`,
  'LinkedIn (campaign)':  (h) => `https://linkedin.com/company/${h.replace(/^@/, '')}`,
  'Threads':              (h) => `https://threads.net/@${h.replace(/^@/, '')}`,
  'Bluesky':              (h) => `https://bsky.app/profile/${h.replace(/^@/, '')}`,
  'X / Twitter':          (h) => `https://x.com/${h.replace(/^@/, '')}`,
  'Facebook page URL':    (h) => `https://facebook.com/${h.replace(/^@/, '')}`,
  'TikTok':               (h) => `https://tiktok.com/@${h.replace(/^@/, '')}`,
  'YouTube':              (h) => `https://youtube.com/@${h.replace(/^@/, '')}`,
  'Telegram':             (h) => `https://t.me/${h.replace(/^@/, '')}`,
};

// Build {fieldName: rawValue} from the deeply-shaped `state`
function flattenState(state) {
  const out = {};
  for (const [stateKey, fieldName] of Object.entries(STATE_TO_FIELD)) {
    out[fieldName] = state?.[stateKey];
  }

  // Issues splits into 4 fields: party/candidate × rationale/contrast,
  // plus first 3 vs additional 4-10 (JSON).
  const issues = Array.isArray(state.issues) ? state.issues : [];
  const nonEmpty = issues.filter((i) => i && (i.name || i.position || i.supportingDetail));
  if (nonEmpty.length) {
    const first3 = nonEmpty.slice(0, 3);
    const rest   = nonEmpty.slice(3);

    const rationale = first3.map((i, idx) =>
      `Issue ${idx + 1}: ${i.name || ''}\n` +
      (i.partyRationale ? `Party rationale: ${i.partyRationale}\n` : '') +
      (i.personalConnection ? `Personal connection: ${i.personalConnection}\n` : '') +
      (i.position ? `Position: ${i.position}\n` : '') +
      (i.supportingDetail ? `Supporting detail: ${i.supportingDetail}` : ''),
    ).filter(Boolean).join('\n\n');
    if (rationale.trim()) out['Issue #1-3 — Party rationale'] = rationale;

    const contrast = first3.map((i, idx) =>
      `Issue ${idx + 1}: ${i.name || ''}\n` +
      (i.contrastOtherParties ? `Contrast w/ other parties: ${i.contrastOtherParties}\n` : '') +
      (i.contrastOpponent ? `Contrast w/ opponent: ${i.contrastOpponent}` : ''),
    ).filter(Boolean).join('\n\n');
    if (contrast.trim()) out['Issue #1-3 — Contrast with other parties'] = contrast;

    if (rest.length) {
      out['Additional Issues #4-#10 (JSON)'] = JSON.stringify(rest);
    }
  }

  // Personal endorsements (candidate) — free text in state, may also be a list later
  if (state.personalEndorsements) {
    out['Personal endorsements (JSON)'] = typeof state.personalEndorsements === 'string'
      ? JSON.stringify([{ note: state.personalEndorsements }])
      : JSON.stringify(state.personalEndorsements);
  }

  return out;
}

export function buildCustomFields(state, optionsMap = {}) {
  const flat = flattenState(state);
  const out = [];
  const unresolved = [];

  // Full state payload as JSON — escape hatch so every form field is in
  // ClickUp without needing 80+ individual custom fields. Strip wizard
  // navigation noise.
  const payloadFid = FIELD_IDS['Form 3 Full Payload (JSON)'];
  if (payloadFid) {
    const skip = new Set(['currentStage', 'completedStages', 'submitting',
      'submitted', 'submitError', 'prefillStatus', 'prefillError',
      'clickupTaskId']);
    const slim = Object.fromEntries(
      Object.entries(state || {}).filter(([k]) => !skip.has(k))
    );
    out.push({ id: payloadFid, value: JSON.stringify(slim).slice(0, 8000) });
  }

  for (const [fname, raw] of Object.entries(flat)) {
    if (empty(raw)) continue;
    const fid = FIELD_IDS[fname];
    if (!fid) continue;
    const type = FIELD_TYPES[fname];
    if (type === 'attachment') continue;

    let value = raw;

    // JSON repeating-block detection by state-key membership
    const stateKeyForName = Object.entries(STATE_TO_FIELD).find(([, n]) => n === fname)?.[0];
    if (stateKeyForName && JSON_FIELDS.has(stateKeyForName)) {
      const cleaned = stripEmptyRows(raw);
      if (!cleaned || !cleaned.length) continue;
      value = JSON.stringify(cleaned);
    } else if (type === 'date') {
      const d = new Date(`${String(raw).slice(0, 10)}T12:00:00Z`);
      if (isNaN(d.getTime())) continue;
      value = d.getTime();
    } else if (type === 'drop_down') {
      const transform = DROPDOWN_VALUE_TRANSFORMS[fname];
      const candidate = transform ? transform(raw) : raw;
      const idx = resolveOption(candidate, optionsMap[fid]);
      if (idx === null || idx === undefined) {
        unresolved.push({ fieldName: fname, fieldId: fid, value: String(raw) });
        continue;
      }
      value = idx;
    } else if (type === 'number' || type === 'currency') {
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      value = n;
    } else {
      // short_text / text / url
      if (Array.isArray(raw)) {
        value = raw.filter((x) => !empty(x)).join(', ');
        if (!value) continue;
      } else if (typeof raw === 'object') {
        value = JSON.stringify(raw);
      } else {
        value = String(raw).trim();
      }
      if (!value) continue;
      // url fields: ClickUp silently drops non-URLs. If the value looks
      // like a bare handle for a known social platform, expand it.
      if (type === 'url' && !/^https?:\/\//i.test(value)) {
        const prefix = URL_HANDLE_PREFIX[fname];
        if (prefix) value = prefix(value);
        else        value = `https://${value.replace(/^\/+/, '')}`;
      }
    }
    out.push({ id: fid, value });
  }
  return { fields: out, unresolved };
}
