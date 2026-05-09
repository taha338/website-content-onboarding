/**
 * Build ClickUp custom_fields[] for the NEW---Website Content Form list.
 * Mirrors campaign-intake/api/clickup-build.js. Per-field POST pattern —
 * see docs/clickup-custom-fields.md §6.
 */

import { FIELD_IDS, FIELD_TYPES, PRIMARY_LIST_ID } from './clickup-field-map.js';

const empty = (v) =>
  v === undefined || v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

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

function resolveLabels(raw, options) {
  if (!options || !options.length) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const norm = (s) => String(s ?? '').trim().toLowerCase();
  const ids = [];
  for (const v of arr) {
    if (empty(v)) continue;
    const opt = options.find((o) =>
      o.id === v || norm(o.name) === norm(v) || norm(o.label) === norm(v),
    );
    if (opt) ids.push(opt.id);
  }
  return ids;
}

// state-key → ClickUp field name mapping. Anything not listed remains in
// the description block from buildDescription() in submit.js.
function flattenState(state) {
  return {
    // Identity / display
    'Display name on site':                   state.displayName,
    'Working campaign slogan / tagline':      state.tagline,
    'Logo files — link':                      state.logoFiles,
    // Candidate biography
    'Born (city, state)':                     state.bornCityState,
    'Raised':                                 state.raised,
    'Current city / town':                    state.currentCity,
    'Years in the district':                  state.yearsInDistrict,
    'What brought them?':                     state.whatBroughtThem,
    'Education (JSON)':                       state.education,
    'Roles, companies, years (most recent first)': state.rolesCompanies,
    'Current occupation / title':             state.currentOccupation,
    'Will candidate continue working during the race?': state.willContinueWorking,
    'Elected / appointed offices held':       state.electedOfficesHeld,
    'Boards and commissions':                 state.boardsCommissions,
    'Professional associations':              state.professionalAssociations,
    'Military service':                       state.militaryService,
    'Nonprofit / volunteer work':             state.nonprofitVolunteer,
    'Awards, honors, notable press hits':     state.awardsHonors,
    'Spouse / partner name':                  state.spouseName,
    "Children's names and ages":              state.childrenAges,
    'Family bios — quotes / role in campaign': state.familyBios,
    'Pets':                                   state.pets,
    'Religion / faith':                       state.religion,
    'Hobbies / Interests':                    state.hobbies,
    'Favorite Local Spots':                   state.favoriteSpots,
    // Narrative & messaging (candidate-mode pieces)
    'Why are you running?':                   state.whyRunning,
    'The inciting moment':                    state.incitingMoment,
    'Differentiation vs. opponent':           state.differentiationOpponent,
    'What do you want a voter to feel?':      state.voterFeel,
    'What do you want them to DO?':           state.voterDo,
    '30-second elevator pitch':               state.elevatorPitch,
    // Record & receipts
    'Top 5 votes to highlight':               state.topVotesHighlight,
    'Votes likely to be attacked — preempt strategy': state.votesAttackedPreempt,
    'Secured endorsements':                   state.securedEndorsements,
    'Notable supporters (non-endorsement)':   state.notableSupporters,
    'Personal endorsements':                  state.personalEndorsements,
    // Risk / legal
    'Topics to avoid entirely':               state.topicsAvoid,
    'Topics requiring legal/compliance review': state.topicsLegalReview,
    'Campaign counsel — name & contact':      state.campaignCounsel,
    'General counsel — name & contact':       state.generalCounsel,
    // Compliance / disclosures
    'Paid-for disclaimer — exact wording':    state.paidForDisclaimer,
    'Placement requirements (disclaimer)':    state.placementRequirements,
    'State election agency':                  state.stateElectionAgency,
    'Local election authority':               state.localElectionAuthority,
    'Applicable disclosure statutes':         state.applicableStatutes,
    'CAN-SPAM footer address':                state.canSpamFooterAddress,
    // Data governance
    'Data retention policy':                  state.dataRetentionPolicy,
    'Supporter data request handling':        state.supporterDataRequests,
    'Data-sharing agreements (public)':       state.dataSharingPublic,
    // Events
    'Events calendar source':                 state.eventsCalendarSource,
    'Events Calendar Owner':                  state.eventsCalendarOwner,
    'Debate schedule + watch-party content':  state.debateSchedule,
    // Media library (candidate)
    'Primary headshot — link':                state.primaryHeadshot,
    'Secondary headshot — link':              state.secondaryHeadshot,
    'Candidate with family — link':           state.candidateWithFamily,
    'Candidate in community — link':          state.candidateInCommunity,
    'Candidate with constituents — link':     state.candidateWithConstituents,
    'Hero / banner crop — link':              state.heroBannerCrop,
    'Lifestyle / environmental shot — link':  state.otherCandidatePhoto,
    'B-Roll — folder link':                   state.bRollUploads,
    'Photographer credit required?':          state.photographerCreditRequired,
    'Model releases on file?':                state.modelReleasesOnFile,
    'Hosting preference (video)':             state.hostingPreference,
    'Captioning vendor':                      state.captioningVendor,
    // Social
    'Facebook page URL':                      state.facebook,
    'Instagram':                              state.instagram,
    'X / Twitter':                            state.twitter,
    'YouTube':                                state.youtube,
    'TikTok':                                 state.tiktok,
    'Other social handle':                    state.otherSocialHandle,
    // Inspiration (one ClickUp field per direction; merge candidate + party state keys)
    'Three websites the candidate likes':     state.websitesLikedCandidate || state.websitesLikedParty,
    'Three websites to avoid':                state.websitesAvoidCandidate || state.websitesAvoidParty,
    // Press
    'Press contact name':                     state.pressContactName,
    'Press contact email':                    state.pressContactEmail,
    'Notable media hits':                     state.notableMediaHits,
    // SEO / transactional / volunteer
    'Target SEO keywords':                    state.targetKeywords,
    'Thank-you page content':                 state.thankYouPageContent,
    'Volunteer categories':                   state.volunteerCategories,
    // Founding (party)
    'Founding Year (display)':                state.foundingYear,
    'Founding Story — long form':        state.foundingStoryLong,
    'Founders (JSON)':                        state.foundersHistorical,
    'Founding moment / catalyst':             state.foundingMoment,
    'Why does the party exist?':              state.whyPartyExists,
    'Differentiation vs. other parties / status quo': state.differentiationOther,
    // Mission/values (party)
    'Mission Statement':                      state.missionStatement,
    'Vision Statement':                       state.visionStatement,
    'Core Values (JSON)':                     state.coreValues,
    'Platform Pillars — full descriptions': state.platformPillarsFull,
    'Position Papers (JSON)':                 state.positionPapers,
    // Membership (party)
    'Membership Numbers / Reach':             state.membershipNumbers,
    'Chapter Directory (JSON)':               state.chapterDirectory,
    'Affiliated Organizations / Coalitions':  state.affiliatedOrgsCoalitions,
    'Notable Past Wins / Milestones':         state.notablePastWins,
    'Internal Committee Structure (public)':  state.internalCommitteeStructure,
    'Leadership Profiles (JSON)':             state.leadershipProfiles,
    'Past Chairs / Leadership History':       state.pastChairs,
    // Issues (1-3 + extra)
    'Issue #1-3 — Party rationale':            extractIssuesField(state.issues, 'partyRationale'),
    'Issue #1-3 — Contrast with other parties': extractIssuesField(state.issues, 'contrastOtherParties'),
    'Additional Issues #4-#10 (JSON)':              state.additionalIssues,
    // Endorsements / wins
    'Top 5 legislative wins / policy victories supported': state.partyLegislativeWins,
    'Past endorsements made by the party':                 state.pastEndorsementsByParty,
    'Endorsed Candidates (JSON)':                          state.endorsedCandidates,
    'Endorsement criteria / process':                      state.endorsementCriteria,
    // Sensitive / legal
    'Internal disagreements / factions to handle carefully': state.internalDisagreements,
    'FEC reporting required?':                state.fecReportingRequired,
    // Events
    'Recurring events to feature':            state.recurringEventsToFeature,
    'Event ticketing / RSVP details':         state.eventTicketingDetails,
    // Photos / media
    'Leadership headshots — folder link': state.leadershipHeadshots,
    'Event photos — folder link':         state.eventPhotos,
    'Rally / convention photos — folder link': state.rallyConventionPhotos,
    'Supporter / crowd shots — folder link':   state.supporterCrowdShots,
    'Existing photo library — Drive / Dropbox link': state.existingPhotoLibrary,
    'Logo secondary / mark variant — link': state.logoSecondary,
    // Press
    'Recent Press Releases (JSON)':           state.recentPressReleases,
    // Social
    'Newsletter / Substack':                  state.newsletterSubstack,
    'Truth Social':                           state.truthSocial,
    'Rumble':                                 state.rumble,
    'Telegram':                               state.telegram,
    // Compliance / legal pages
    'Privacy Policy':                         state.privacyPolicy,
    'Terms of Service / Site Terms':          state.termsOfService,
    'Cookie consent preferences':             state.cookieConsent,
    'Pages requiring translation':            state.pagesRequiringTranslation,
    'Who provides translation?':              state.whoProvidesTranslation,
    'Required pages list':                    state.requiredPagesList,
    // Email
    'Welcome email content':                  state.welcomeEmailContent,
    'Drip sequence content':                  state.dripSequenceContent,
    'Email list segmentation':                state.emailListSegmentation,
    // Donations
    'Suggested donation tiers':               state.donationTiers,
    'Recurring donation default':             state.recurringDonationDefault,
    'Recurring frequency':                    state.recurringFrequency,
    'Contribution-limit disclaimer text':     state.contributionLimitDisclaimer,
    'Donor eligibility disclaimer text':      state.donorEligibilityDisclaimer,
    // Voting / GOTV
    'Polling place lookup link':              state.pollingPlaceLookup,
    'Voter registration deadline':            state.voterRegDeadline,
    'Sample ballot link':                     state.sampleBallotLink,
    'Early voting / absentee info':           state.earlyVotingInfo,
    'GOTV plan content':                      state.gotvPlanContent,
    // Membership pages
    'Membership tiers & benefits':            state.membershipTiersBenefits,
    'How-to-join workflow (public copy)':     state.howToJoinPublicCopy,
    // Public docs
    'Bylaws (public version) — link':    state.bylawsPublic,
    'Platform document (public) — link': state.platformDocPublic,
    'Constitution (public) — link':      state.constitutionPublic,
    'Platform versioning':                    state.platformVersioning,
    'Resolutions archive':                    state.resolutionsArchive,
    // Slate cards (attachment - skipped)
    'Slate cards / sample ballots — uploads': state.slateCardsUploads,
  };
}

// issues array → join the named subfield across rows into a single text block
function extractIssuesField(issues, subKey) {
  if (!Array.isArray(issues)) return null;
  const rows = issues
    .map((row, i) => {
      const v = row && row[subKey];
      return v && String(v).trim() ? `Issue ${i + 1} — ${row?.name || '(unnamed)'}: ${String(v).trim()}` : null;
    })
    .filter(Boolean);
  return rows.length ? rows.join('\n\n') : null;
}

function isProbablyValidPhoneE164(e164) {
  if (/^\+1555/.test(e164)) return false;
  return /^\+\d{10,15}$/.test(e164);
}

export function buildCustomFields(state, optionsMap = {}) {
  const flat = flattenState(state);
  const out = [];
  const unresolved = [];

  for (const [name, raw] of Object.entries(flat)) {
    if (empty(raw)) continue;
    const fid = FIELD_IDS[name];
    if (!fid) continue;
    const type = FIELD_TYPES[name];
    if (type === 'attachment') continue;

    let value = raw;
    if (type === 'date') {
      const d = new Date(`${String(raw).slice(0, 10)}T12:00:00Z`);
      if (isNaN(d.getTime())) continue;
      value = d.getTime();
    } else if (type === 'drop_down') {
      const idx = resolveOption(raw, optionsMap[fid]);
      if (idx === null || idx === undefined) {
        unresolved.push({ fieldName: name, fieldId: fid, value: String(raw) });
        continue;
      }
      value = idx;
    } else if (type === 'labels') {
      const ids = resolveLabels(raw, optionsMap[fid]);
      if (!ids.length) continue;
      value = ids;
    } else if (type === 'number' || type === 'currency') {
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      value = n;
    } else if (type === 'phone') {
      const digits = String(raw).replace(/\D/g, '');
      if (!digits || digits.length < 10) continue;
      const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
      if (!isProbablyValidPhoneE164(e164)) {
        unresolved.push({ fieldName: name, fieldId: fid, value: String(raw), reason: 'invalid phone' });
        continue;
      }
      value = e164;
    } else if (type === 'url') {
      const s = String(raw).trim();
      if (!/^https?:\/\//i.test(s)) {
        unresolved.push({ fieldName: name, fieldId: fid, value: s, reason: 'URL needs scheme' });
        continue;
      }
      value = s;
    } else {
      // short_text / text / email
      if (Array.isArray(raw)) {
        const hasObjects = raw.some((x) => x && typeof x === 'object');
        if (hasObjects) {
          const cleaned = raw.filter((row) =>
            row && typeof row === 'object' &&
            Object.values(row).some((v) => !empty(v))
          );
          if (!cleaned.length) continue;
          value = JSON.stringify(cleaned);
        } else {
          const s = raw.filter((x) => !empty(x)).join(', ');
          if (!s) continue;
          value = s;
        }
      } else if (typeof raw === 'object') {
        value = JSON.stringify(raw);
      } else {
        value = String(raw).trim();
      }
      if (!value) continue;
    }
    out.push({ id: fid, value });
  }
  return { fields: out, unresolved };
}
