/**
 * Generate a downloadable PDF summary of a Form 3 (Website Content)
 * submission. Uses jsPDF directly with text rendering.
 */
import { jsPDF } from 'jspdf';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COL = {
  ink: '#1a1a1a',
  red: '#a61e22',
  black: '#000000',
  muted: '#6b6b6b',
};
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export function generateContentPdf(state) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const newPage = (need = 80) => { if (y + need > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; } };
  const drawDivider = () => {
    doc.setDrawColor(...hexToRgb(COL.red));
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN + 60, y);
    y += 12;
  };
  const drawTitle = (t) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(COL.black));
    doc.setFontSize(20);
    doc.text(t, MARGIN, y);
    y += 28;
  };
  const drawSubtitle = (t) => {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...hexToRgb(COL.muted));
    doc.setFontSize(11);
    doc.text(t, MARGIN, y);
    y += 18;
  };
  const drawSectionHeader = (t) => {
    newPage(60);
    y += 12;
    drawDivider();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(COL.black));
    doc.setFontSize(14);
    doc.text(t.toUpperCase(), MARGIN, y);
    y += 22;
  };
  const drawField = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    const display = formatValue(value);
    if (!display) return;
    newPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(COL.muted));
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb(COL.ink));
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(display, CONTENT_W);
    for (const line of lines) {
      newPage(14);
      doc.text(line, MARGIN, y);
      y += 14;
    }
    y += 6;
  };

  // ── Cover ──
  drawTitle('Website Content');
  drawSubtitle(`Operation 1776 · client ${state.clientId || '—'}  ·  generated ${new Date().toLocaleString()}`);
  y += 10;

  // ── 1. Identity ──
  drawSectionHeader('1 · Identity');
  drawField('Subject Type', state.subjectType);
  drawField('Display Name', state.displayName);
  drawField('Tagline / Slogan', state.tagline);
  drawField('Logo files', state.logoFiles);
  drawField('Logo (secondary)', state.logoSecondary);

  // ── 2A. Candidate Bio ──
  if (state.subjectType === 'candidate') {
    drawSectionHeader('2A · Candidate Biography');
    drawField('Born', state.bornCityState);
    drawField('Raised', state.raised);
    drawField('Current City', state.currentCity);
    drawField('Years in District', state.yearsInDistrict);
    drawField('What brought them', state.whatBroughtThem);
    if (state.education && state.education.some((e) => e.school)) {
      const ed = state.education
        .filter((e) => e.school || e.degree)
        .map((e) => `• ${e.school || '?'} — ${e.degree || '?'} (${e.year || '?'})`)
        .join('\n');
      drawField('Education', ed);
    }
    drawField('Roles, Companies, Years', state.rolesCompanies);
    drawField('Current Occupation', state.currentOccupation);
    drawField('Continue Working During Race?', state.willContinueWorking);
    drawField('Elected/Appointed Offices Held', state.electedOfficesHeld);
    drawField('Boards & Commissions', state.boardsCommissions);
    drawField('Professional Associations', state.professionalAssociations);
    drawField('Military Service', state.militaryService);
    drawField('Nonprofit / Volunteer Work', state.nonprofitVolunteer);
    drawField('Awards & Honors', state.awardsHonors);
    drawField('Spouse / Partner', state.spouseName);
    drawField("Children's Names & Ages", state.childrenAges);
    drawField('Family Bios', state.familyBios);
    drawField('Pets', state.pets);
    drawField('Religion / Faith', state.religion);
    drawField('Hobbies', state.hobbies);
    drawField('Favorite Local Spots', state.favoriteSpots);
  }

  // ── 2B. Party Profile ──
  if (state.subjectType === 'party') {
    drawSectionHeader('2B · Party Profile');
    drawField('Founding Year', state.foundingYear);
    drawField('Founding Story', state.foundingStoryLong);
    if (state.foundersHistorical && state.foundersHistorical.some((f) => f.name)) {
      const f = state.foundersHistorical
        .filter((x) => x.name)
        .map((x) => `• ${x.name} — ${x.role || ''}`)
        .join('\n');
      drawField('Founders / Key Figures', f);
    }
    drawField('Mission Statement', state.missionStatement);
    drawField('Vision Statement', state.visionStatement);
    if (state.coreValues && state.coreValues.some((v) => v.value)) {
      const cv = state.coreValues.filter((v) => v.value).map((v) => `• ${v.value}`).join('\n');
      drawField('Core Values', cv);
    }
    drawField('Platform Pillars (full)', state.platformPillarsFull);
    if (state.positionPapers && state.positionPapers.some((p) => p.title)) {
      const pp = state.positionPapers
        .filter((p) => p.title)
        .map((p) => `• ${p.title} — ${p.summary || ''}${p.link ? ' (' + p.link + ')' : ''}`)
        .join('\n');
      drawField('Position Papers', pp);
    }
    drawField('Membership Numbers / Reach', state.membershipNumbers);
    if (state.chapterDirectory && state.chapterDirectory.some((c) => c.name)) {
      const cd = state.chapterDirectory
        .filter((c) => c.name)
        .map((c) => `• ${c.name} — ${c.region || ''} — ${c.contact || ''}${c.url ? ' (' + c.url + ')' : ''}`)
        .join('\n');
      drawField('Chapter Directory', cd);
    }
    drawField('Affiliated Orgs / Coalitions', state.affiliatedOrgsCoalitions);
    drawField('Notable Past Wins', state.notablePastWins);
    drawField('Internal Committee Structure', state.internalCommitteeStructure);
  }

  // ── 2C. Leadership Profiles (party) ──
  if (state.subjectType === 'party' && state.leadershipProfiles && state.leadershipProfiles.some((l) => l.name)) {
    drawSectionHeader('2C · Leadership Profiles');
    state.leadershipProfiles
      .filter((l) => l.name)
      .forEach((l, i) => {
        drawField(`Leader ${i + 1} — Name`, l.name);
        drawField('Title / Role', l.title);
        drawField('Short Bio', l.shortBio);
        drawField('Long Bio', l.longBio);
        drawField('City / State', l.cityState);
        drawField('Background', l.background);
        drawField('Joined Party', l.joinedYear);
        drawField('Quote', l.quote);
      });
    drawField('Past Chairs / Leadership History', state.pastChairs);
  }

  // ── 3. Narrative ──
  drawSectionHeader('3 · Narrative & Messaging');
  drawField('Why Running?', state.whyRunning);
  drawField('Why Party Exists?', state.whyPartyExists);
  drawField('Inciting Moment', state.incitingMoment);
  drawField('Founding Moment', state.foundingMoment);
  drawField('Differentiation vs Opponent', state.differentiationOpponent);
  drawField('Differentiation vs Other Parties', state.differentiationOther);
  drawField('What voters should FEEL', state.voterFeel);
  drawField('What voters should DO', state.voterDo);
  drawField('Elevator Pitch', state.elevatorPitch);

  // ── 4. Issues ──
  if (state.issues && state.issues.some((i) => i.name)) {
    drawSectionHeader('4 · Issues / Platform');
    state.issues.forEach((row, i) => {
      if (!row.name && !row.position) return;
      drawField(`Issue #${i + 1} — Name`, row.name);
      drawField('Position', row.position);
      drawField('Supporting Detail', row.supportingDetail);
      drawField('Personal Connection', row.personalConnection);
      drawField('Party Rationale', row.partyRationale);
      drawField('Contrast w/ Opponent', row.contrastOpponent);
      drawField('Contrast w/ Other Parties', row.contrastOtherParties);
    });
  }

  // ── 5. Record ──
  drawSectionHeader('5 · Record & Receipts');
  drawField('Top Votes to Highlight', state.topVotesHighlight);
  drawField('Votes Likely Attacked', state.votesAttackedPreempt);
  drawField('Party Legislative Wins', state.partyLegislativeWins);
  drawField('Past Endorsements (party)', state.pastEndorsementsByParty);
  drawField('Secured Endorsements', state.securedEndorsements);
  drawField('Notable Supporters', state.notableSupporters);
  drawField('Personal Endorsements', state.personalEndorsements);

  // ── 6. Risk ──
  drawSectionHeader('6 · Risk & Legal');
  drawField('Topics to Avoid', state.topicsAvoid);
  drawField('Topics Requiring Legal Review', state.topicsLegalReview);
  drawField('Internal Disagreements', state.internalDisagreements);
  drawField('Campaign Counsel', state.campaignCounsel);
  drawField('General Counsel', state.generalCounsel);

  // ── 7. Compliance ──
  drawSectionHeader('7 · Compliance & Disclosures');
  drawField('Paid-for Disclaimer', state.paidForDisclaimer);
  drawField('Placement Requirements', state.placementRequirements);
  drawField('State Election Agency', state.stateElectionAgency);
  drawField('Local Election Authority', state.localElectionAuthority);
  drawField('Applicable Statutes', state.applicableStatutes);
  drawField('FEC Reporting Required?', state.fecReportingRequired);
  drawField('CAN-SPAM Footer Address', state.canSpamFooterAddress);

  // ── 8. Data ──
  drawSectionHeader('8 · Data Governance');
  drawField('Data Retention Policy', state.dataRetentionPolicy);
  drawField('Supporter Data Requests', state.supporterDataRequests);
  drawField('Data-sharing (public)', state.dataSharingPublic);

  // ── 9. Endorsed Candidates (party) ──
  if (state.subjectType === 'party' && state.endorsedCandidates && state.endorsedCandidates.some((c) => c.name)) {
    drawSectionHeader('9 · Endorsed Candidates');
    const eb = state.endorsedCandidates
      .filter((c) => c.name)
      .map((c) => `• ${c.name} — ${c.office || ''}, ${c.state || ''} (${c.year || ''})${c.link ? ' — ' + c.link : ''}`)
      .join('\n');
    drawField('Endorsed Slate', eb);
    drawField('Endorsement Criteria', state.endorsementCriteria);
    drawField('Slate Cards / Sample Ballots', state.slateCardsUploads);
  }

  // ── 10. Events ──
  drawSectionHeader('10 · Events');
  drawField('Events Calendar Source', state.eventsCalendarSource);
  drawField('Events Calendar Owner', state.eventsCalendarOwner);
  drawField('Recurring Events', state.recurringEventsToFeature);
  drawField('Debate Schedule', state.debateSchedule);
  drawField('Event Ticketing Details', state.eventTicketingDetails);

  // ── 11. Media ──
  drawSectionHeader('11 · Media Library');
  drawField('Primary Headshot', state.primaryHeadshot);
  drawField('Secondary Headshot', state.secondaryHeadshot);
  drawField('Candidate w/ Family', state.candidateWithFamily);
  drawField('Candidate in Community', state.candidateInCommunity);
  drawField('Candidate w/ Constituents', state.candidateWithConstituents);
  drawField('Hero / Banner Crop', state.heroBannerCrop);
  drawField('Other Photo', state.otherCandidatePhoto);
  drawField('Official Seal / Emblem', state.officialSeal);
  drawField('Leadership Headshots', state.leadershipHeadshots);
  drawField('Event Photos', state.eventPhotos);
  drawField('Rally / Convention Photos', state.rallyConventionPhotos);
  drawField('Supporter / Crowd Shots', state.supporterCrowdShots);
  drawField('Photographer Credit?', state.photographerCreditRequired);
  drawField('Model Releases on File?', state.modelReleasesOnFile);
  drawField('Hosting Preference', state.hostingPreference);
  drawField('B-Roll', state.bRollUploads);
  drawField('Captioning Vendor', state.captioningVendor);
  drawField('Existing Photo Library', state.existingPhotoLibrary);

  // ── 12. Social ──
  drawSectionHeader('12 · Social Media');
  drawField('Facebook', state.facebook);
  drawField('Instagram', state.instagram);
  drawField('X / Twitter', state.twitter);
  drawField('YouTube', state.youtube);
  drawField('TikTok', state.tiktok);
  drawField('Truth Social', state.truthSocial);
  drawField('Rumble', state.rumble);
  drawField('Telegram', state.telegram);
  drawField('Newsletter / Substack', state.newsletterSubstack);
  drawField('Other Social Handle', state.otherSocialHandle);

  // ── 13–14. Inspiration + Press ──
  drawSectionHeader('13 · Inspiration & References');
  drawField('Websites Liked (candidate)', state.websitesLikedCandidate);
  drawField('Websites to Avoid (candidate)', state.websitesAvoidCandidate);
  drawField('Websites Liked (party)', state.websitesLikedParty);
  drawField('Websites to Avoid (party)', state.websitesAvoidParty);
  drawField('Brand Guidelines', state.brandGuidelinesUpload);

  drawSectionHeader('14 · Press & Newsroom');
  drawField('Press Contact', state.pressContactName);
  drawField('Press Contact Email', state.pressContactEmail);
  if (state.recentPressReleases && state.recentPressReleases.some((p) => p.title)) {
    const pr = state.recentPressReleases
      .filter((p) => p.title)
      .map((p) => `• ${p.date || ''} — ${p.title}\n  ${p.body || ''}\n  ${p.link || ''}`)
      .join('\n');
    drawField('Recent Press Releases', pr);
  }
  drawField('Notable Media Hits', state.notableMediaHits);

  // ── 16+ ──
  drawSectionHeader('16 · Site Compliance Pages');
  drawField('Privacy Policy', state.privacyPolicy);
  drawField('Terms of Service', state.termsOfService);
  drawField('Cookie Consent', state.cookieConsent);
  drawField('Pages Requiring Translation', state.pagesRequiringTranslation);
  drawField('Who Provides Translation', state.whoProvidesTranslation);

  drawSectionHeader('17 · Site Structure');
  drawField('Required Pages', state.requiredPagesList);

  drawSectionHeader('18 · Email Content');
  drawField('Welcome Email', state.welcomeEmailContent);
  drawField('Drip Sequence', state.dripSequenceContent);
  drawField('Email List Segmentation', state.emailListSegmentation);

  drawSectionHeader('19 · Fundraising Page');
  drawField('Donation Tiers', state.donationTiers);
  drawField('Recurring Default', state.recurringDonationDefault);
  drawField('Recurring Frequency', state.recurringFrequency);
  drawField('Contribution Limit Disclaimer', state.contributionLimitDisclaimer);
  drawField('Donor Eligibility Disclaimer', state.donorEligibilityDisclaimer);

  if (state.subjectType === 'candidate') {
    drawSectionHeader('20 · Voter Resources');
    drawField('Polling Place Lookup', state.pollingPlaceLookup);
    drawField('Voter Registration Deadline', state.voterRegDeadline);
    drawField('Sample Ballot Link', state.sampleBallotLink);
    drawField('Early Voting / Absentee', state.earlyVotingInfo);
    drawField('GOTV Plan', state.gotvPlanContent);
  }

  if (state.subjectType === 'party') {
    drawSectionHeader('21 · Membership Pages');
    drawField('Membership Tiers & Benefits', state.membershipTiersBenefits);
    drawField('How-to-Join Workflow (public)', state.howToJoinPublicCopy);

    drawSectionHeader('22 · Public Governance');
    drawField('Bylaws (public)', state.bylawsPublic);
    drawField('Platform Document (public)', state.platformDocPublic);
    drawField('Constitution (public)', state.constitutionPublic);
    drawField('Platform Versioning', state.platformVersioning);
    drawField('Resolutions Archive', state.resolutionsArchive);
  }

  drawSectionHeader('23 · SEO Inputs');
  drawField('Target Keywords', state.targetKeywords);

  drawSectionHeader('24 · Transactional Pages');
  drawField('Thank-You Page Content', state.thankYouPageContent);

  drawSectionHeader('25 · Volunteer Page');
  drawField('Volunteer Categories', state.volunteerCategories);

  // ── Footer ──
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...hexToRgb(COL.muted));
  doc.setFontSize(9);
  newPage(30);
  y += 10;
  doc.text('Operation 1776 — Rooted in Freedom. Driven by Purpose.', MARGIN, y);

  const fileName = `${state.clientId || 'website-content'}-summary.pdf`;
  doc.save(fileName);
}

function formatValue(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'object' && v !== null) return JSON.stringify(v, null, 2);
  return String(v).trim();
}
