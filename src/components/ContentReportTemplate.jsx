/**
 * ContentReportTemplate
 * ---------------------
 * Static, capture-friendly visual report for the Website Content (Form 3)
 * submission. Source DOM for the PDF export — html2canvas-friendly,
 * inline styles only, no animations. Mirrors the political-brand-discovery
 * brand report aesthetic (Op1776 navy + red, structured sections, small-
 * caps labels, clean cards).
 */

import { useEffect } from 'react';

const PAGE_BG = '#FFFFFF';
const NAVY = '#1C2E5B';
const RED = '#B22234';
const TEXT_DARK = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const HEADING_FONT = "'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, sans-serif";
const BODY_FONT = "'Inter', system-ui, -apple-system, Segoe UI, sans-serif";

function useGoogleFonts() {
  useEffect(() => {
    const families = ['Plus Jakarta Sans', 'Inter'];
    families.forEach((family) => {
      const id = `content-pdf-font-${family.replace(/\s+/g, '-')}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800;900&display=swap`;
      link.id = id;
      document.head.appendChild(link);
    });
  }, []);
}

function isFilled(v) {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

function formatValue(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  return String(v).trim();
}

function SectionTitle({ number, label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, padding: 0, borderRadius: '50%',
          background: NAVY, color: '#FFFFFF', fontSize: 12, fontWeight: 700,
          letterSpacing: 0, fontFamily: BODY_FONT,
          boxSizing: 'border-box', flexShrink: 0, lineHeight: 1,
        }}>{number}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: MUTED, fontFamily: BODY_FONT,
        }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
      </div>
      <h2 style={{
        fontFamily: HEADING_FONT,
        fontSize: 26, fontWeight: 800, color: NAVY,
        margin: 0, letterSpacing: '-0.01em', lineHeight: 1.15,
      }}>{children}</h2>
    </div>
  );
}

function Field({ label, value }) {
  if (!isFilled(value)) return null;
  const display = formatValue(value);
  if (!display) return null;
  return (
    <div data-pdf-field="" style={{ breakInside: 'avoid' }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: MUTED, margin: '0 0 6px',
        fontFamily: BODY_FONT,
      }}>{label}</p>
      <p style={{
        fontSize: 14, color: TEXT_DARK, margin: 0, lineHeight: 1.55,
        fontFamily: BODY_FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>{display}</p>
    </div>
  );
}

function FieldGrid({ children, columns = 2 }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${BORDER}`,
      borderRadius: 14,
      padding: '24px 26px',
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: '20px 28px',
    }}>{items}</div>
  );
}

function Section({ number, label, title, children, columns = 2 }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  const anyFilled = items.some((c) => {
    if (!c || !c.props) return false;
    if (c.props.value !== undefined) return isFilled(c.props.value);
    return true;
  });
  if (!anyFilled) return null;
  return (
    <div data-pdf-section="" style={{ marginBottom: 36, breakInside: 'avoid' }}>
      <SectionTitle number={number} label={label}>{title}</SectionTitle>
      <FieldGrid columns={columns}>{items}</FieldGrid>
    </div>
  );
}

export default function ContentReportTemplate({ state }) {
  useGoogleFonts();

  const isCandidate = state.subjectType === 'candidate';
  const isParty = state.subjectType === 'party';
  const headline = state.displayName || (isParty ? 'Party Website Content' : 'Website Content Brief');

  const educationLines = (state.education || [])
    .filter((e) => e && (e.school || e.degree))
    .map((e) => `• ${e.school || '?'} — ${e.degree || '?'} (${e.year || '?'})`)
    .join('\n');

  const foundersLines = (state.foundersHistorical || [])
    .filter((x) => x && x.name)
    .map((x) => `• ${x.name} — ${x.role || ''}`)
    .join('\n');

  const coreValueLines = (state.coreValues || [])
    .filter((v) => v && v.value)
    .map((v) => `• ${v.value}`)
    .join('\n');

  const positionPaperLines = (state.positionPapers || [])
    .filter((p) => p && p.title)
    .map((p) => `• ${p.title} — ${p.summary || ''}${p.link ? ' (' + p.link + ')' : ''}`)
    .join('\n');

  const chapterDirectoryLines = (state.chapterDirectory || [])
    .filter((c) => c && c.name)
    .map((c) => `• ${c.name} — ${c.region || ''} — ${c.contact || ''}${c.url ? ' (' + c.url + ')' : ''}`)
    .join('\n');

  const endorsedSlateLines = (state.endorsedCandidates || [])
    .filter((c) => c && c.name)
    .map((c) => `• ${c.name} — ${c.office || ''}, ${c.state || ''} (${c.year || ''})${c.link ? ' — ' + c.link : ''}`)
    .join('\n');

  const pressReleaseLines = (state.recentPressReleases || [])
    .filter((p) => p && p.title)
    .map((p) => `• ${p.date || ''} — ${p.title}\n  ${p.body || ''}\n  ${p.link || ''}`)
    .join('\n');

  return (
    <div style={{
      width: 1100,
      background: PAGE_BG,
      fontFamily: BODY_FONT,
      color: TEXT_DARK,
      padding: '64px 64px 80px',
      boxSizing: 'border-box',
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: RED,
          }}>Operation 1776</span>
          <div style={{ width: 200, height: 1, background: BORDER }} />
        </div>
        <h1 style={{
          fontFamily: HEADING_FONT,
          fontSize: 48, fontWeight: 800, color: NAVY,
          margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05,
        }}>Website Content Brief</h1>
        <p style={{ fontSize: 15, color: MUTED, margin: '12px 0 0', fontFamily: BODY_FONT }}>
          The full source-of-truth content brief captured for this site build.
        </p>
      </div>

      {/* HERO */}
      <div data-pdf-section="" style={{
        background: NAVY,
        color: '#FFFFFF',
        borderRadius: 22,
        padding: '44px 44px',
        marginBottom: 44,
        borderTop: `4px solid ${RED}`,
        borderBottom: `4px solid ${RED}`,
      }}>
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#FFFFFF', opacity: 0.78,
          margin: '0 0 18px', fontFamily: BODY_FONT,
        }}>{isParty ? 'Party Website' : isCandidate ? 'Candidate Website' : 'Website'}</p>

        <h2 style={{
          fontFamily: HEADING_FONT,
          fontSize: 56, fontWeight: 800, lineHeight: 1.05,
          color: '#FFFFFF', margin: 0, letterSpacing: '-0.015em',
        }}>{headline}</h2>

        {state.tagline && (
          <p style={{
            fontFamily: HEADING_FONT,
            fontSize: 22, color: '#FFFFFF', opacity: 0.92,
            margin: '14px 0 0', fontWeight: 500, fontStyle: 'italic',
          }}>“{state.tagline}”</p>
        )}

        <div style={{ width: 80, height: 3, background: RED, margin: '24px 0' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
          {[
            { label: 'Client ID', value: state.clientId },
            { label: 'Generated', value: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Subject Type', value: state.subjectType },
          ].filter((x) => isFilled(x.value)).map((x) => (
            <div key={x.label}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6, margin: '0 0 4px' }}>{x.label}</p>
              <p style={{ fontSize: 13, color: '#FFFFFF', margin: 0, fontWeight: 500 }}>{x.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Section number="1" label="Section 1" title="Identity">
        <Field label="Subject Type" value={state.subjectType} />
        <Field label="Display Name" value={state.displayName} />
        <Field label="Tagline / Slogan" value={state.tagline} />
        <Field label="Logo Files" value={state.logoFiles} />
        <Field label="Logo (Secondary)" value={state.logoSecondary} />
      </Section>

      {isCandidate && (
        <Section number="2A" label="Candidate Bio" title="Candidate Biography">
          <Field label="Born" value={state.bornCityState} />
          <Field label="Raised" value={state.raised} />
          <Field label="Current City" value={state.currentCity} />
          <Field label="Years in District" value={state.yearsInDistrict} />
          <Field label="What Brought Them" value={state.whatBroughtThem} />
          <Field label="Education" value={educationLines} />
          <Field label="Roles, Companies, Years" value={state.rolesCompanies} />
          <Field label="Current Occupation" value={state.currentOccupation} />
          <Field label="Continue Working During Race?" value={state.willContinueWorking} />
          <Field label="Elected/Appointed Offices Held" value={state.electedOfficesHeld} />
          <Field label="Boards & Commissions" value={state.boardsCommissions} />
          <Field label="Professional Associations" value={state.professionalAssociations} />
          <Field label="Military Service" value={state.militaryService} />
          <Field label="Nonprofit / Volunteer Work" value={state.nonprofitVolunteer} />
          <Field label="Awards & Honors" value={state.awardsHonors} />
          <Field label="Spouse / Partner" value={state.spouseName} />
          <Field label="Children's Names & Ages" value={state.childrenAges} />
          <Field label="Family Bios" value={state.familyBios} />
          <Field label="Pets" value={state.pets} />
          <Field label="Religion / Faith" value={state.religion} />
          <Field label="Hobbies" value={state.hobbies} />
          <Field label="Favorite Local Spots" value={state.favoriteSpots} />
        </Section>
      )}

      {isParty && (
        <Section number="2B" label="Party Profile" title="Party Profile">
          <Field label="Founding Year" value={state.foundingYear} />
          <Field label="Founding Story" value={state.foundingStoryLong} />
          <Field label="Founders / Key Figures" value={foundersLines} />
          <Field label="Mission Statement" value={state.missionStatement} />
          <Field label="Vision Statement" value={state.visionStatement} />
          <Field label="Core Values" value={coreValueLines} />
          <Field label="Platform Pillars (Full)" value={state.platformPillarsFull} />
          <Field label="Position Papers" value={positionPaperLines} />
          <Field label="Membership Numbers / Reach" value={state.membershipNumbers} />
          <Field label="Chapter Directory" value={chapterDirectoryLines} />
          <Field label="Affiliated Orgs / Coalitions" value={state.affiliatedOrgsCoalitions} />
          <Field label="Notable Past Wins" value={state.notablePastWins} />
          <Field label="Internal Committee Structure" value={state.internalCommitteeStructure} />
        </Section>
      )}

      {isParty && state.leadershipProfiles?.some?.((l) => l && l.name) && (
        <div data-pdf-section="" style={{ marginBottom: 36 }}>
          <SectionTitle number="2C" label="Leadership">Leadership Profiles</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {state.leadershipProfiles.filter((l) => l && l.name).map((l, i) => (
              <div key={i} data-pdf-field="" style={{
                background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: '22px 24px',
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: RED, margin: '0 0 8px', fontFamily: BODY_FONT,
                }}>Leader {i + 1}</p>
                <p style={{ fontFamily: HEADING_FONT, fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>
                  {l.name}
                </p>
                {l.title && <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 12px' }}>{l.title}</p>}
                {l.shortBio && <p style={{ fontSize: 13, color: TEXT_DARK, margin: '0 0 8px', lineHeight: 1.55 }}>{l.shortBio}</p>}
                {l.longBio && <p style={{ fontSize: 12, color: TEXT_DARK, margin: '0 0 8px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{l.longBio}</p>}
                {l.cityState && <p style={{ fontSize: 11, color: MUTED, margin: '4px 0 0' }}>{l.cityState}</p>}
                {l.quote && (
                  <p style={{
                    borderLeft: `3px solid ${RED}`, paddingLeft: 12, marginTop: 10,
                    fontSize: 13, fontStyle: 'italic', color: TEXT_DARK,
                  }}>"{l.quote}"</p>
                )}
              </div>
            ))}
          </div>
          {state.pastChairs && (
            <div style={{ marginTop: 20 }}>
              <FieldGrid columns={1}>
                <Field label="Past Chairs / Leadership History" value={state.pastChairs} />
              </FieldGrid>
            </div>
          )}
        </div>
      )}

      <Section number="3" label="Section 3" title="Narrative &amp; Messaging">
        <Field label="Why Running?" value={state.whyRunning} />
        <Field label="Why Party Exists?" value={state.whyPartyExists} />
        <Field label="Inciting Moment" value={state.incitingMoment} />
        <Field label="Founding Moment" value={state.foundingMoment} />
        <Field label="Differentiation vs Opponent" value={state.differentiationOpponent} />
        <Field label="Differentiation vs Other Parties" value={state.differentiationOther} />
        <Field label="What Voters Should FEEL" value={state.voterFeel} />
        <Field label="What Voters Should DO" value={state.voterDo} />
        <Field label="Elevator Pitch" value={state.elevatorPitch} />
      </Section>

      {state.issues?.some?.((i) => i && (i.name || i.position)) && (
        <div data-pdf-section="" style={{ marginBottom: 36 }}>
          <SectionTitle number="4" label="Section 4">Issues / Platform</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {state.issues.filter((i) => i && (i.name || i.position)).map((row, i) => (
              <div key={i} data-pdf-field="" style={{
                background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: '22px 26px',
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: RED, margin: '0 0 6px',
                }}>Issue #{i + 1}</p>
                {row.name && (
                  <p style={{ fontFamily: HEADING_FONT, fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
                    {row.name}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 24px' }}>
                  <Field label="Position" value={row.position} />
                  <Field label="Supporting Detail" value={row.supportingDetail} />
                  <Field label="Personal Connection" value={row.personalConnection} />
                  <Field label="Party Rationale" value={row.partyRationale} />
                  <Field label="Contrast w/ Opponent" value={row.contrastOpponent} />
                  <Field label="Contrast w/ Other Parties" value={row.contrastOtherParties} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section number="5" label="Section 5" title="Record &amp; Receipts">
        <Field label="Top Votes to Highlight" value={state.topVotesHighlight} />
        <Field label="Votes Likely Attacked" value={state.votesAttackedPreempt} />
        <Field label="Party Legislative Wins" value={state.partyLegislativeWins} />
        <Field label="Past Endorsements (Party)" value={state.pastEndorsementsByParty} />
        <Field label="Secured Endorsements" value={state.securedEndorsements} />
        <Field label="Notable Supporters" value={state.notableSupporters} />
        <Field label="Personal Endorsements" value={state.personalEndorsements} />
      </Section>

      <Section number="6" label="Section 6" title="Risk &amp; Legal">
        <Field label="Topics to Avoid" value={state.topicsAvoid} />
        <Field label="Topics Requiring Legal Review" value={state.topicsLegalReview} />
        <Field label="Internal Disagreements" value={state.internalDisagreements} />
        <Field label="Campaign Counsel" value={state.campaignCounsel} />
        <Field label="General Counsel" value={state.generalCounsel} />
      </Section>

      <Section number="7" label="Section 7" title="Compliance &amp; Disclosures">
        <Field label="Paid-for Disclaimer" value={state.paidForDisclaimer} />
        <Field label="Placement Requirements" value={state.placementRequirements} />
        <Field label="State Election Agency" value={state.stateElectionAgency} />
        <Field label="Local Election Authority" value={state.localElectionAuthority} />
        <Field label="Applicable Statutes" value={state.applicableStatutes} />
        <Field label="FEC Reporting Required?" value={state.fecReportingRequired} />
        <Field label="CAN-SPAM Footer Address" value={state.canSpamFooterAddress} />
      </Section>

      <Section number="8" label="Section 8" title="Data Governance">
        <Field label="Data Retention Policy" value={state.dataRetentionPolicy} />
        <Field label="Supporter Data Requests" value={state.supporterDataRequests} />
        <Field label="Data-sharing (Public)" value={state.dataSharingPublic} />
      </Section>

      {isParty && (
        <Section number="9" label="Section 9" title="Endorsed Candidates">
          <Field label="Endorsed Slate" value={endorsedSlateLines} />
          <Field label="Endorsement Criteria" value={state.endorsementCriteria} />
          <Field label="Slate Cards / Sample Ballots" value={state.slateCardsUploads} />
        </Section>
      )}

      <Section number="10" label="Section 10" title="Events">
        <Field label="Events Calendar Source" value={state.eventsCalendarSource} />
        <Field label="Events Calendar Owner" value={state.eventsCalendarOwner} />
        <Field label="Recurring Events" value={state.recurringEventsToFeature} />
        <Field label="Debate Schedule" value={state.debateSchedule} />
        <Field label="Event Ticketing Details" value={state.eventTicketingDetails} />
      </Section>

      <Section number="11" label="Section 11" title="Media Library">
        <Field label="Primary Headshot" value={state.primaryHeadshot} />
        <Field label="Secondary Headshot" value={state.secondaryHeadshot} />
        <Field label="Candidate w/ Family" value={state.candidateWithFamily} />
        <Field label="Candidate in Community" value={state.candidateInCommunity} />
        <Field label="Candidate w/ Constituents" value={state.candidateWithConstituents} />
        <Field label="Hero / Banner Crop" value={state.heroBannerCrop} />
        <Field label="Other Photo" value={state.otherCandidatePhoto} />
        <Field label="Official Seal / Emblem" value={state.officialSeal} />
        <Field label="Leadership Headshots" value={state.leadershipHeadshots} />
        <Field label="Event Photos" value={state.eventPhotos} />
        <Field label="Rally / Convention Photos" value={state.rallyConventionPhotos} />
        <Field label="Supporter / Crowd Shots" value={state.supporterCrowdShots} />
        <Field label="Photographer Credit?" value={state.photographerCreditRequired} />
        <Field label="Model Releases on File?" value={state.modelReleasesOnFile} />
        <Field label="Hosting Preference" value={state.hostingPreference} />
        <Field label="B-Roll" value={state.bRollUploads} />
        <Field label="Captioning Vendor" value={state.captioningVendor} />
        <Field label="Existing Photo Library" value={state.existingPhotoLibrary} />
      </Section>

      <Section number="12" label="Section 12" title="Social Media">
        <Field label="Facebook" value={state.facebook} />
        <Field label="Instagram" value={state.instagram} />
        <Field label="X / Twitter" value={state.twitter} />
        <Field label="YouTube" value={state.youtube} />
        <Field label="TikTok" value={state.tiktok} />
        <Field label="Truth Social" value={state.truthSocial} />
        <Field label="Rumble" value={state.rumble} />
        <Field label="Telegram" value={state.telegram} />
        <Field label="Newsletter / Substack" value={state.newsletterSubstack} />
        <Field label="Other Social Handle" value={state.otherSocialHandle} />
      </Section>

      <Section number="13" label="Section 13" title="Inspiration &amp; References">
        <Field label="Websites Liked (Candidate)" value={state.websitesLikedCandidate} />
        <Field label="Websites to Avoid (Candidate)" value={state.websitesAvoidCandidate} />
        <Field label="Websites Liked (Party)" value={state.websitesLikedParty} />
        <Field label="Websites to Avoid (Party)" value={state.websitesAvoidParty} />
        <Field label="Brand Guidelines" value={state.brandGuidelinesUpload} />
      </Section>

      <Section number="14" label="Section 14" title="Press &amp; Newsroom">
        <Field label="Press Contact" value={state.pressContactName} />
        <Field label="Press Contact Email" value={state.pressContactEmail} />
        <Field label="Recent Press Releases" value={pressReleaseLines} />
        <Field label="Notable Media Hits" value={state.notableMediaHits} />
      </Section>

      <Section number="16" label="Section 16" title="Site Compliance Pages">
        <Field label="Privacy Policy" value={state.privacyPolicy} />
        <Field label="Terms of Service" value={state.termsOfService} />
        <Field label="Cookie Consent" value={state.cookieConsent} />
        <Field label="Pages Requiring Translation" value={state.pagesRequiringTranslation} />
        <Field label="Who Provides Translation" value={state.whoProvidesTranslation} />
      </Section>

      <Section number="17" label="Section 17" title="Site Structure" columns={1}>
        <Field label="Required Pages" value={state.requiredPagesList} />
      </Section>

      <Section number="18" label="Section 18" title="Email Content">
        <Field label="Welcome Email" value={state.welcomeEmailContent} />
        <Field label="Drip Sequence" value={state.dripSequenceContent} />
        <Field label="Email List Segmentation" value={state.emailListSegmentation} />
      </Section>

      <Section number="19" label="Section 19" title="Fundraising Page">
        <Field label="Donation Tiers" value={state.donationTiers} />
        <Field label="Recurring Default" value={state.recurringDonationDefault} />
        <Field label="Recurring Frequency" value={state.recurringFrequency} />
        <Field label="Contribution Limit Disclaimer" value={state.contributionLimitDisclaimer} />
        <Field label="Donor Eligibility Disclaimer" value={state.donorEligibilityDisclaimer} />
      </Section>

      {isCandidate && (
        <Section number="20" label="Section 20" title="Voter Resources">
          <Field label="Polling Place Lookup" value={state.pollingPlaceLookup} />
          <Field label="Voter Registration Deadline" value={state.voterRegDeadline} />
          <Field label="Sample Ballot Link" value={state.sampleBallotLink} />
          <Field label="Early Voting / Absentee" value={state.earlyVotingInfo} />
          <Field label="GOTV Plan" value={state.gotvPlanContent} />
        </Section>
      )}

      {isParty && (
        <Section number="21" label="Section 21" title="Membership Pages">
          <Field label="Membership Tiers & Benefits" value={state.membershipTiersBenefits} />
          <Field label="How-to-Join Workflow (Public)" value={state.howToJoinPublicCopy} />
        </Section>
      )}

      {isParty && (
        <Section number="22" label="Section 22" title="Public Governance">
          <Field label="Bylaws (Public)" value={state.bylawsPublic} />
          <Field label="Platform Document (Public)" value={state.platformDocPublic} />
          <Field label="Constitution (Public)" value={state.constitutionPublic} />
          <Field label="Platform Versioning" value={state.platformVersioning} />
          <Field label="Resolutions Archive" value={state.resolutionsArchive} />
        </Section>
      )}

      <Section number="23" label="Section 23" title="SEO Inputs" columns={1}>
        <Field label="Target Keywords" value={state.targetKeywords} />
      </Section>

      <Section number="24" label="Section 24" title="Transactional Pages" columns={1}>
        <Field label="Thank-You Page Content" value={state.thankYouPageContent} />
      </Section>

      <Section number="25" label="Section 25" title="Volunteer Page" columns={1}>
        <Field label="Volunteer Categories" value={state.volunteerCategories} />
      </Section>

      {/* FOOTER */}
      <div data-pdf-section="" style={{
        marginTop: 48, paddingTop: 24, borderTop: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: BODY_FONT,
      }}>
        <p style={{ fontSize: 11, color: MUTED, margin: 0, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
          Operation 1776
        </p>
        <p style={{ fontSize: 11, color: MUTED, margin: 0, fontStyle: 'italic' }}>
          Rooted in Freedom. Driven by Purpose.
        </p>
      </div>
    </div>
  );
}
