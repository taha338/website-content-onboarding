/**
 * Form 3 — Website Content sections 1 through 25.
 *
 * Subject-type-aware: candidate-only sections (2A, 20, parts of 3/4/5/6)
 * render only when subjectType === 'candidate'; party-only sections
 * (2B, 2C, 9, 21, 22, parts of 3/4/5/6) render only for parties.
 */
import { useContent } from '../../context/ContentContext';
import {
  Section, TextField, TextArea, Select, RadioGroup, TwoCol,
} from '../Field';
import RepeatingBlock from '../RepeatingBlock';
import {
  YES_NO, YES_NO_PARTIAL, RECURRING_FREQUENCY,
  PRIVACY_POLICY_STATES, COOKIE_CONSENT,
  TRANSLATION_PROVIDERS, HOSTING_PREFERENCE,
} from '../../lib/options';

/**
 * Shown wherever the form asks for Drive / Dropbox / WeTransfer links.
 * Without these sharing settings, the Op1776 team can't open the files.
 */
function SharingInstructions() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm leading-relaxed">
      <p className="font-display tracking-wide text-amber-900 uppercase text-xs mb-2">
        ⚠ Important — set sharing permissions before pasting
      </p>
      <p className="text-amber-900 mb-2">
        We can't open private folders. For every link you paste below, please make sure:
      </p>
      <ul className="list-disc ml-5 text-amber-900 space-y-1">
        <li>
          <strong>Google Drive:</strong> right-click the file/folder → <em>Share</em> →
          change <em>"Restricted"</em> to <strong>"Anyone with the link"</strong> →
          access set to <strong>Viewer</strong> → <em>Copy link</em>.
        </li>
        <li>
          <strong>Dropbox:</strong> hover the file/folder → <em>Share</em> → toggle
          <strong> "Anyone with this link can view"</strong> ON → <em>Copy link</em>.
        </li>
        <li>
          <strong>WeTransfer:</strong> use the public download link from your transfer email.
          Note: WeTransfer links expire after 7 days — Drive/Dropbox is preferred.
        </li>
      </ul>
      <p className="text-amber-800 text-xs mt-2 italic">
        If we get a "you need access" error, your campaign timeline may slip while we
        wait for permissions.
      </p>
    </div>
  );
}

/* ─── 1. Identity ─── */
export function S1Identity() {
  const { state, update } = useContent();
  return (
    <Section defaultOpen index="1" title="Identity">
      <TwoCol>
        <TextField
          label="Display Name on Site"
          value={state.displayName}
          onChange={(v) => update({ displayName: v })}
          help="Auto-pulled from Form 1 'DBA / Trade Name'. Editable."
        />
        <TextField
          label="Tagline / Slogan"
          value={state.tagline}
          onChange={(v) => update({ tagline: v })}
          placeholder='e.g. "Defend What Matters."'
        />
      </TwoCol>
      <TwoCol>
        <TextField
          label="Logo files — paste link"
          optional
          value={state.logoFiles}
          onChange={(v) => update({ logoFiles: v })}
          help="Drive / Dropbox / WeTransfer link. Auto-pulled from Form 2 if uploaded there."
        />
        <TextField
          label="Logo — secondary / mark variant link"
          optional
          value={state.logoSecondary}
          onChange={(v) => update({ logoSecondary: v })}
        />
      </TwoCol>
    </Section>
  );
}

/* ─── 2A. Candidate Biography ─── */
export function S2ACandidateBio() {
  const { state, update, updateRepeating, addRepeating, removeRepeating, isCandidate } = useContent();
  if (!isCandidate) return null;
  return (
    <Section defaultOpen index="2A" title="Candidate Biography">
      <TwoCol>
        <TextField label="Born (city, state)" value={state.bornCityState} onChange={(v) => update({ bornCityState: v })} />
        <TextField label="Raised (if different)" optional value={state.raised} onChange={(v) => update({ raised: v })} />
      </TwoCol>
      <TwoCol>
        <TextField label="Current city / town" value={state.currentCity} onChange={(v) => update({ currentCity: v })} />
        <TextField label="Years in the district" value={state.yearsInDistrict} onChange={(v) => update({ yearsInDistrict: v })} />
      </TwoCol>
      <TextArea label="If not from here — what brought them?" optional rows={3} value={state.whatBroughtThem} onChange={(v) => update({ whatBroughtThem: v })} />

      <RepeatingBlock
        label="Education"
        items={state.education}
        onAdd={() => addRepeating('education', { school: '', degree: '', year: '' })}
        onRemove={(i) => removeRepeating('education', i)}
        addLabel="Add another school"
        renderRow={(row, i) => (
          <TwoCol>
            <TextField label="School" value={row.school} onChange={(v) => updateRepeating('education', i, { school: v })} />
            <TextField label="Degree" value={row.degree} onChange={(v) => updateRepeating('education', i, { degree: v })} />
          </TwoCol>
        )}
      />

      <TextArea label="Roles, companies, years (most recent first)" rows={4} value={state.rolesCompanies} onChange={(v) => update({ rolesCompanies: v })} />
      <TwoCol>
        <TextField label="Current occupation / title" value={state.currentOccupation} onChange={(v) => update({ currentOccupation: v })} />
        <RadioGroup label="Continue working during the race?" value={state.willContinueWorking} onChange={(v) => update({ willContinueWorking: v })} options={YES_NO_PARTIAL} />
      </TwoCol>

      <TextArea label="Elected / appointed offices held" optional rows={3} value={state.electedOfficesHeld} onChange={(v) => update({ electedOfficesHeld: v })} />
      <TextArea label="Boards and commissions" optional rows={3} value={state.boardsCommissions} onChange={(v) => update({ boardsCommissions: v })} />
      <TextArea label="Professional associations" optional rows={3} value={state.professionalAssociations} onChange={(v) => update({ professionalAssociations: v })} />
      <TextArea label="Military service" optional rows={2} value={state.militaryService} onChange={(v) => update({ militaryService: v })} help="Branch / dates / rank" />
      <TextArea label="Nonprofit / volunteer work" optional rows={3} value={state.nonprofitVolunteer} onChange={(v) => update({ nonprofitVolunteer: v })} />
      <TextArea label="Awards, honors, notable press hits, published work" optional rows={3} value={state.awardsHonors} onChange={(v) => update({ awardsHonors: v })} />

      <p className="op-section-num pt-4">FAMILY</p>
      <TwoCol>
        <TextField label="Spouse / partner name" optional value={state.spouseName} onChange={(v) => update({ spouseName: v })} />
        <TextField label="Children's names and ages" optional value={state.childrenAges} onChange={(v) => update({ childrenAges: v })} />
      </TwoCol>
      <TextArea label="Family bios — quotes / photos / role in campaign" optional rows={3} value={state.familyBios} onChange={(v) => update({ familyBios: v })} />
      <TwoCol>
        <TextField label="Pets" optional value={state.pets} onChange={(v) => update({ pets: v })} />
        <TextField label="Religion / faith" optional value={state.religion} onChange={(v) => update({ religion: v })} />
      </TwoCol>
      <TwoCol>
        <TextField label="Hobbies / interests" optional value={state.hobbies} onChange={(v) => update({ hobbies: v })} />
        <TextField label="Favorite local spots" optional value={state.favoriteSpots} onChange={(v) => update({ favoriteSpots: v })} />
      </TwoCol>
    </Section>
  );
}

/* ─── 2B. Party Profile ─── */
export function S2BPartyProfile() {
  const { state, update, updateRepeating, addRepeating, removeRepeating, isParty } = useContent();
  if (!isParty) return null;
  return (
    <Section defaultOpen index="2B" title="Party Profile">
      <TextField label="Founding Year" optional value={state.foundingYear} onChange={(v) => update({ foundingYear: v })} help="Auto from Form 1." />
      <TextArea label="Founding Story — long form" rows={5} value={state.foundingStoryLong} onChange={(v) => update({ foundingStoryLong: v })} help="Pre-filled from Form 2 dropdown; expand to full narrative." />

      <RepeatingBlock
        label="Founders / Key Historical Figures"
        items={state.foundersHistorical}
        onAdd={() => addRepeating('foundersHistorical', { name: '', role: '', dates: '' })}
        onRemove={(i) => removeRepeating('foundersHistorical', i)}
        addLabel="Add another founder"
        renderRow={(row, i) => (
          <TwoCol>
            <TextField label="Name" value={row.name} onChange={(v) => updateRepeating('foundersHistorical', i, { name: v })} />
            <TextField label="Role / Dates" value={row.role} onChange={(v) => updateRepeating('foundersHistorical', i, { role: v })} placeholder="Founder, Chair 2010–2018, etc." />
          </TwoCol>
        )}
      />

      <TextArea label="Mission Statement" rows={3} value={state.missionStatement} onChange={(v) => update({ missionStatement: v })} />
      <TextArea label="Vision Statement" rows={3} value={state.visionStatement} onChange={(v) => update({ visionStatement: v })} />

      <RepeatingBlock
        label="Core Values"
        help="Minimum 3. Add more if you'd like."
        items={state.coreValues}
        minRows={3}
        onAdd={() => addRepeating('coreValues', { value: '' })}
        onRemove={(i) => removeRepeating('coreValues', i)}
        addLabel="Add another value"
        renderRow={(row, i) => (
          <TextField label={`Value ${i + 1}`} value={row.value} onChange={(v) => updateRepeating('coreValues', i, { value: v })} />
        )}
      />

      <TextArea label="Platform Pillars — full descriptions" rows={5} value={state.platformPillarsFull} onChange={(v) => update({ platformPillarsFull: v })} help="Pillar names pre-filled from Form 2; add body copy." />

      <RepeatingBlock
        label="Position Papers / Resolutions"
        items={state.positionPapers}
        onAdd={() => addRepeating('positionPapers', { title: '', summary: '', link: '' })}
        onRemove={(i) => removeRepeating('positionPapers', i)}
        addLabel="Add another paper"
        renderRow={(row, i) => (
          <>
            <TextField label="Title" value={row.title} onChange={(v) => updateRepeating('positionPapers', i, { title: v })} />
            <TextArea label="Summary" rows={2} value={row.summary} onChange={(v) => updateRepeating('positionPapers', i, { summary: v })} />
            <TextField label="Link" optional value={row.link} onChange={(v) => updateRepeating('positionPapers', i, { link: v })} />
          </>
        )}
      />

      <TextField label="Membership Numbers / Reach" optional value={state.membershipNumbers} onChange={(v) => update({ membershipNumbers: v })} help="Optional public stats." />

      <RepeatingBlock
        label="Chapter / State Directory"
        items={state.chapterDirectory}
        onAdd={() => addRepeating('chapterDirectory', { name: '', region: '', contact: '', url: '' })}
        onRemove={(i) => removeRepeating('chapterDirectory', i)}
        addLabel="Add another chapter"
        renderRow={(row, i) => (
          <>
            <TwoCol>
              <TextField label="Chapter name" value={row.name} onChange={(v) => updateRepeating('chapterDirectory', i, { name: v })} />
              <TextField label="Region" value={row.region} onChange={(v) => updateRepeating('chapterDirectory', i, { region: v })} />
            </TwoCol>
            <TwoCol>
              <TextField label="Contact" value={row.contact} onChange={(v) => updateRepeating('chapterDirectory', i, { contact: v })} />
              <TextField label="URL" optional value={row.url} onChange={(v) => updateRepeating('chapterDirectory', i, { url: v })} />
            </TwoCol>
          </>
        )}
      />

      <TextArea label="Affiliated Organizations / Coalitions (public)" rows={3} value={state.affiliatedOrgsCoalitions} onChange={(v) => update({ affiliatedOrgsCoalitions: v })} help="Pre-filled from Form 2; add URLs + relationship type." />
      <TextArea label="Notable Past Wins / Milestones" rows={4} value={state.notablePastWins} onChange={(v) => update({ notablePastWins: v })} />
      <TextArea label="Internal Committee Structure (public-facing)" optional rows={4} value={state.internalCommitteeStructure} onChange={(v) => update({ internalCommitteeStructure: v })} help="Pre-filled from Form 1 internal committees; mark which are public." />
    </Section>
  );
}

/* ─── 2C. Leadership Profiles (party only, repeating) ─── */
export function S2CLeadership() {
  const { state, update, updateRepeating, addRepeating, removeRepeating, isParty } = useContent();
  if (!isParty) return null;
  return (
    <Section defaultOpen index="2C" title="Leadership Profiles" subtitle="One block per public-facing leader.">
      <SharingInstructions />
      <RepeatingBlock
        items={state.leadershipProfiles}
        onAdd={() => addRepeating('leadershipProfiles', { name: '', title: '', shortBio: '', longBio: '', headshot: '', cityState: '', background: '', joinedYear: '', socialHandles: '', quote: '' })}
        onRemove={(i) => removeRepeating('leadershipProfiles', i)}
        addLabel="Add another leader"
        renderRow={(row, i) => (
          <>
            <TwoCol>
              <TextField label="Full Name" value={row.name} onChange={(v) => updateRepeating('leadershipProfiles', i, { name: v })} />
              <TextField label="Title / Role" value={row.title} onChange={(v) => updateRepeating('leadershipProfiles', i, { title: v })} />
            </TwoCol>
            <TextArea label="Short Bio (~50 words)" rows={2} value={row.shortBio} onChange={(v) => updateRepeating('leadershipProfiles', i, { shortBio: v })} />
            <TextArea label="Long Bio (~250 words)" rows={5} value={row.longBio} onChange={(v) => updateRepeating('leadershipProfiles', i, { longBio: v })} />
            <TwoCol>
              <TextField label="Headshot link (Drive/Dropbox)" value={row.headshot} onChange={(v) => updateRepeating('leadershipProfiles', i, { headshot: v })} />
              <TextField label="City / State" value={row.cityState} onChange={(v) => updateRepeating('leadershipProfiles', i, { cityState: v })} />
            </TwoCol>
            <TwoCol>
              <TextField label="Background" value={row.background} onChange={(v) => updateRepeating('leadershipProfiles', i, { background: v })} placeholder="Career, military, faith, etc." />
              <TextField label="Joined Party (year)" value={row.joinedYear} onChange={(v) => updateRepeating('leadershipProfiles', i, { joinedYear: v })} />
            </TwoCol>
            <TextField label="Social Handles" optional value={row.socialHandles} onChange={(v) => updateRepeating('leadershipProfiles', i, { socialHandles: v })} />
            <TextArea label="Quote / 'why I serve'" optional rows={2} value={row.quote} onChange={(v) => updateRepeating('leadershipProfiles', i, { quote: v })} />
          </>
        )}
      />
      <TextArea label="Past Chairs / Leadership History" optional rows={4} value={state.pastChairs} onChange={(v) => update({ pastChairs: v })} help="Repeating: name + title + tenure + photo link" />
    </Section>
  );
}

/* ─── 3. Narrative & Messaging ─── */
export function S3Narrative() {
  const { state, update, isParty, isCandidate, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="3" title="Narrative &amp; Messaging">
      {isCandidate && (
        <>
          <TextArea label="Why are you running?" rows={4} value={state.whyRunning} onChange={(v) => update({ whyRunning: v })} />
          <TextArea label="The inciting moment" rows={3} value={state.incitingMoment} onChange={(v) => update({ incitingMoment: v })} />
          <TextArea label="Differentiation vs. opponent" rows={3} value={state.differentiationOpponent} onChange={(v) => update({ differentiationOpponent: v })} />
        </>
      )}
      {isParty && (
        <>
          <TextArea label="Why does the party exist?" rows={4} value={state.whyPartyExists} onChange={(v) => update({ whyPartyExists: v })} />
          <TextArea label="Founding moment / catalyst (narrative)" rows={3} value={state.foundingMoment} onChange={(v) => update({ foundingMoment: v })} help="Distinct from 2B; the emotional/homepage version." />
          <TextArea label="Differentiation vs. other parties / status quo" rows={3} value={state.differentiationOther} onChange={(v) => update({ differentiationOther: v })} />
        </>
      )}
      <TextField label="What do you want a visitor to FEEL?" value={state.voterFeel} onChange={(v) => update({ voterFeel: v })} placeholder="Hope, urgency, pride…" />
      <TextField label="What do you want them to DO?" value={state.voterDo} onChange={(v) => update({ voterDo: v })} placeholder="Vote, donate, join, volunteer, attend" />
      <TextArea label="30-second elevator pitch" rows={3} value={state.elevatorPitch} onChange={(v) => update({ elevatorPitch: v })} />
    </Section>
  );
}

/* ─── 4. Issues / Platform — start with 3, "Add another" up to 10 ─── */
export function S4Issues() {
  const { state, updateIssue, addRepeating, removeRepeating, isParty, isCandidate, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  const MIN_ISSUES = 3;
  const MAX_ISSUES = 10;
  const blank = {
    name: '', position: '', supportingDetail: '',
    personalConnection: '', partyRationale: '',
    contrastOpponent: '', contrastOtherParties: '',
  };
  return (
    <Section defaultOpen index="4" title="Issues / Platform" subtitle="At least 3 issues. Add more if you'd like — up to 10.">
      {state.issues.map((row, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--color-op-line)] bg-white space-y-3 relative">
          <div className="flex items-center justify-between">
            <p className="op-section-num">ISSUE #{i + 1}</p>
            {state.issues.length > MIN_ISSUES && (
              <button
                type="button"
                onClick={() => removeRepeating('issues', i)}
                className="text-xs font-semibold text-[var(--color-op-muted)] hover:text-[var(--color-op-red)] uppercase tracking-wider"
              >
                Remove
              </button>
            )}
          </div>
          <TextField label="Name" value={row.name} onChange={(v) => updateIssue(i, { name: v })} />
          <TextArea label="Position" rows={2} value={row.position} onChange={(v) => updateIssue(i, { position: v })} />
          <TextArea label="Supporting detail" rows={3} value={row.supportingDetail} onChange={(v) => updateIssue(i, { supportingDetail: v })} />
          {isCandidate && (
            <>
              <TextArea label="Personal connection" rows={3} value={row.personalConnection} onChange={(v) => updateIssue(i, { personalConnection: v })} />
              <TextArea label="Contrast with opponent" rows={2} value={row.contrastOpponent} onChange={(v) => updateIssue(i, { contrastOpponent: v })} />
            </>
          )}
          {isParty && (
            <>
              <TextArea label="Party rationale" rows={3} value={row.partyRationale} onChange={(v) => updateIssue(i, { partyRationale: v })} />
              <TextArea label="Contrast with other parties" rows={2} value={row.contrastOtherParties} onChange={(v) => updateIssue(i, { contrastOtherParties: v })} />
            </>
          )}
        </div>
      ))}
      {state.issues.length < MAX_ISSUES && (
        <button
          type="button"
          onClick={() => addRepeating('issues', blank)}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-[var(--color-op-red)] hover:bg-red-50 transition-colors"
        >
          + Add another issue ({state.issues.length} of {MAX_ISSUES})
        </button>
      )}
    </Section>
  );
}

/* ─── 5. Record & Receipts ─── */
export function S5Record() {
  const { state, update, isParty, isCandidate, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="5" title="Record &amp; Receipts">
      {isCandidate && (
        <>
          <TextArea label="Top 5 votes to highlight" rows={4} value={state.topVotesHighlight} onChange={(v) => update({ topVotesHighlight: v })} help="Bill #, date, summary." />
          <TextArea label="Votes likely to be attacked — preempt strategy" rows={3} value={state.votesAttackedPreempt} onChange={(v) => update({ votesAttackedPreempt: v })} />
        </>
      )}
      {isParty && (
        <>
          <TextArea label="Top 5 legislative wins / policy victories supported" rows={4} value={state.partyLegislativeWins} onChange={(v) => update({ partyLegislativeWins: v })} />
          <TextArea label="Past endorsements made by the party (historical)" rows={4} value={state.pastEndorsementsByParty} onChange={(v) => update({ pastEndorsementsByParty: v })} help="Distinct from current cycle slate (Section 9)." />
        </>
      )}
      <TextArea label="Secured endorsements" rows={3} value={state.securedEndorsements} onChange={(v) => update({ securedEndorsements: v })} help="Org/individual, date, URL/permission." />
      <TextArea label="Notable supporters (non-endorsement)" rows={3} value={state.notableSupporters} onChange={(v) => update({ notableSupporters: v })} help="Up to 10 entries." />
      {isCandidate && (
        <TextArea label="Personal endorsements (pastors, community leaders)" optional rows={3} value={state.personalEndorsements} onChange={(v) => update({ personalEndorsements: v })} help="Repeating: name + role + quote + photo link" />
      )}
    </Section>
  );
}

/* ─── 6. Risk / Legal ─── */
export function S6RiskLegal() {
  const { state, update, isParty, isCandidate, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="6" title="Risk &amp; Legal">
      <TextArea label="Topics to avoid entirely" rows={3} value={state.topicsAvoid} onChange={(v) => update({ topicsAvoid: v })} />
      <TextArea label="Topics requiring legal/compliance review" rows={3} value={state.topicsLegalReview} onChange={(v) => update({ topicsLegalReview: v })} />
      {isParty && (
        <TextArea label="Internal disagreements / factions to handle carefully" optional rows={3} value={state.internalDisagreements} onChange={(v) => update({ internalDisagreements: v })} />
      )}
      {isCandidate && (
        <TextField label="Campaign counsel — name & contact" optional value={state.campaignCounsel} onChange={(v) => update({ campaignCounsel: v })} />
      )}
      {isParty && (
        <TextField label="General counsel — name & contact" optional value={state.generalCounsel} onChange={(v) => update({ generalCounsel: v })} />
      )}
    </Section>
  );
}

/* ─── 7. Compliance / Disclosures ─── */
export function S7Compliance() {
  const { state, update, isParty, isCandidate, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="7" title="Compliance &amp; Disclosures">
      <TextArea label="Paid-for disclaimer — exact wording" rows={2} value={state.paidForDisclaimer} onChange={(v) => update({ paidForDisclaimer: v })} />
      <TextArea label="Placement requirements" optional rows={2} value={state.placementRequirements} onChange={(v) => update({ placementRequirements: v })} />
      <TwoCol>
        <TextField label="State election agency" value={state.stateElectionAgency} onChange={(v) => update({ stateElectionAgency: v })} />
        {isCandidate && <TextField label="Local election authority" value={state.localElectionAuthority} onChange={(v) => update({ localElectionAuthority: v })} />}
      </TwoCol>
      <TextField label="Applicable disclosure statute / rule numbers" optional value={state.applicableStatutes} onChange={(v) => update({ applicableStatutes: v })} />
      {isParty && <RadioGroup label="FEC reporting required?" value={state.fecReportingRequired} onChange={(v) => update({ fecReportingRequired: v })} options={YES_NO} />}
      <TextField label="Physical mailing address (CAN-SPAM footer)" value={state.canSpamFooterAddress} onChange={(v) => update({ canSpamFooterAddress: v })} help="Pre-fills from Form 1." />
    </Section>
  );
}

/* ─── 8. Data Governance ─── */
export function S8DataGov() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="8" title="Data Governance">
      <TextArea label="Data retention policy" rows={3} value={state.dataRetentionPolicy} onChange={(v) => update({ dataRetentionPolicy: v })} />
      <TextArea label="How are supporter / member data requests (deletion, access) handled?" rows={3} value={state.supporterDataRequests} onChange={(v) => update({ supporterDataRequests: v })} />
      <TextArea label="Data-sharing agreements (public-facing)" optional rows={3} value={state.dataSharingPublic} onChange={(v) => update({ dataSharingPublic: v })} help="Pre-filled from Form 1; mark which are disclosed publicly." />
    </Section>
  );
}

/* ─── 9. Endorsed Candidates (party only) ─── */
export function S9Endorsed() {
  const { state, update, updateRepeating, addRepeating, removeRepeating, isParty } = useContent();
  if (!isParty) return null;
  return (
    <Section defaultOpen index="9" title="Endorsed Candidates" subtitle="Current cycle slate.">
      <RepeatingBlock
        items={state.endorsedCandidates}
        onAdd={() => addRepeating('endorsedCandidates', { name: '', office: '', state: '', year: '', photo: '', link: '' })}
        onRemove={(i) => removeRepeating('endorsedCandidates', i)}
        addLabel="Add another endorsement"
        renderRow={(row, i) => (
          <>
            <TwoCol>
              <TextField label="Candidate Name" value={row.name} onChange={(v) => updateRepeating('endorsedCandidates', i, { name: v })} />
              <TextField label="Office" value={row.office} onChange={(v) => updateRepeating('endorsedCandidates', i, { office: v })} />
            </TwoCol>
            <TwoCol>
              <TextField label="State" value={row.state} onChange={(v) => updateRepeating('endorsedCandidates', i, { state: v })} />
              <TextField label="Year" value={row.year} onChange={(v) => updateRepeating('endorsedCandidates', i, { year: v })} />
            </TwoCol>
            <TwoCol>
              <TextField label="Photo link" optional value={row.photo} onChange={(v) => updateRepeating('endorsedCandidates', i, { photo: v })} />
              <TextField label="Candidate URL" optional value={row.link} onChange={(v) => updateRepeating('endorsedCandidates', i, { link: v })} />
            </TwoCol>
          </>
        )}
      />
      <TextArea label="Endorsement criteria / process" optional rows={3} value={state.endorsementCriteria} onChange={(v) => update({ endorsementCriteria: v })} />
      <TextField label="Slate cards / sample ballots — link" optional value={state.slateCardsUploads} onChange={(v) => update({ slateCardsUploads: v })} />
    </Section>
  );
}

/* ─── 10. Events ─── */
export function S10Events() {
  const { state, update, isCandidate, isParty, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="10" title="Events">
      <TwoCol>
        <TextField label="Events Calendar Source" value={state.eventsCalendarSource} onChange={(v) => update({ eventsCalendarSource: v })} placeholder="Google Calendar, Eventbrite, Mobilize, Manual…" />
        <TextField label="Events Calendar Owner" value={state.eventsCalendarOwner} onChange={(v) => update({ eventsCalendarOwner: v })} />
      </TwoCol>
      <TextArea label="Hard milestones (auto from Form 1)" optional rows={3} value={state.hardMilestonesFromForm1} onChange={(v) => update({ hardMilestonesFromForm1: v })} help="Pre-filled from Form 1; add more if needed." />
      {isParty && <TextArea label="Recurring events to feature" optional rows={3} value={state.recurringEventsToFeature} onChange={(v) => update({ recurringEventsToFeature: v })} help="Monthly meetings, conventions, etc." />}
      {isCandidate && <TextArea label="Debate schedule + watch-party content" optional rows={3} value={state.debateSchedule} onChange={(v) => update({ debateSchedule: v })} help="Repeating: date + venue + watch-party logistics" />}
      <TextArea label="Event ticketing / RSVP details" optional rows={3} value={state.eventTicketingDetails} onChange={(v) => update({ eventTicketingDetails: v })} help="Platform, seat caps, accessibility accommodations." />
    </Section>
  );
}

/* ─── 11. Media Library ─── */
export function S11Media() {
  const { state, update, isCandidate, isParty, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="11" title="Media Library" subtitle="Paste Drive/Dropbox/WeTransfer links to assets. Direct upload coming in v1.">
      <SharingInstructions />
      {isCandidate && (
        <>
          <TwoCol>
            <TextField label="Primary headshot — link" value={state.primaryHeadshot} onChange={(v) => update({ primaryHeadshot: v })} />
            <TextField label="Secondary headshot — link" optional value={state.secondaryHeadshot} onChange={(v) => update({ secondaryHeadshot: v })} />
          </TwoCol>
          <TwoCol>
            <TextField label="Candidate with family — link" optional value={state.candidateWithFamily} onChange={(v) => update({ candidateWithFamily: v })} />
            <TextField label="Candidate in community — link" optional value={state.candidateInCommunity} onChange={(v) => update({ candidateInCommunity: v })} />
          </TwoCol>
          <TwoCol>
            <TextField label="Candidate with constituents — link" optional value={state.candidateWithConstituents} onChange={(v) => update({ candidateWithConstituents: v })} />
            <TextField label="Hero / banner crop — link" value={state.heroBannerCrop} onChange={(v) => update({ heroBannerCrop: v })} />
          </TwoCol>
          <TextField label="Other photo — link" optional value={state.otherCandidatePhoto} onChange={(v) => update({ otherCandidatePhoto: v })} />
        </>
      )}
      {isParty && (
        <>
          <TextField label="Official seal / emblem — link" value={state.officialSeal} onChange={(v) => update({ officialSeal: v })} help="Pre-filled from Form 2 if uploaded there." />
          <TwoCol>
            <TextField label="Leadership headshots — folder link" optional value={state.leadershipHeadshots} onChange={(v) => update({ leadershipHeadshots: v })} />
            <TextField label="Event photos — folder link" optional value={state.eventPhotos} onChange={(v) => update({ eventPhotos: v })} />
          </TwoCol>
          <TwoCol>
            <TextField label="Rally / convention photos — folder link" optional value={state.rallyConventionPhotos} onChange={(v) => update({ rallyConventionPhotos: v })} />
            <TextField label="Supporter / crowd shots — folder link" optional value={state.supporterCrowdShots} onChange={(v) => update({ supporterCrowdShots: v })} />
          </TwoCol>
          <TextField label="Hero / banner crop — link" value={state.heroBannerCrop} onChange={(v) => update({ heroBannerCrop: v })} />
        </>
      )}
      <TwoCol>
        <RadioGroup label="Photographer credit required?" value={state.photographerCreditRequired} onChange={(v) => update({ photographerCreditRequired: v })} options={YES_NO} />
        <RadioGroup label="Model releases on file?" value={state.modelReleasesOnFile} onChange={(v) => update({ modelReleasesOnFile: v })} options={YES_NO} />
      </TwoCol>
      <Select label="Hosting preference (video)" value={state.hostingPreference} onChange={(v) => update({ hostingPreference: v })} options={HOSTING_PREFERENCE} />
      <TextField label="B-Roll — folder link" optional value={state.bRollUploads} onChange={(v) => update({ bRollUploads: v })} help="Multi-upload supported in v1." />
      <TextField label="Captioning required? Vendor?" optional value={state.captioningVendor} onChange={(v) => update({ captioningVendor: v })} />
      <TextField label="Existing photo library — Drive / Dropbox link" optional value={state.existingPhotoLibrary} onChange={(v) => update({ existingPhotoLibrary: v })} help="Avoids redundant shoots." />
    </Section>
  );
}

/* ─── 12. Social Media ─── */
export function S12Social() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="12" title="Social Media">
      <TwoCol>
        <TextField label="Facebook page URL" optional value={state.facebook} onChange={(v) => update({ facebook: v })} />
        <TextField label="Instagram" optional value={state.instagram} onChange={(v) => update({ instagram: v })} />
      </TwoCol>
      <TwoCol>
        <TextField label="X / Twitter" optional value={state.twitter} onChange={(v) => update({ twitter: v })} />
        <TextField label="YouTube" optional value={state.youtube} onChange={(v) => update({ youtube: v })} />
      </TwoCol>
      <TwoCol>
        <TextField label="TikTok" optional value={state.tiktok} onChange={(v) => update({ tiktok: v })} />
        <TextField label="Truth Social" optional value={state.truthSocial} onChange={(v) => update({ truthSocial: v })} />
      </TwoCol>
      <TwoCol>
        <TextField label="Rumble" optional value={state.rumble} onChange={(v) => update({ rumble: v })} />
        <TextField label="Telegram" optional value={state.telegram} onChange={(v) => update({ telegram: v })} />
      </TwoCol>
      <TextField label="Newsletter / Substack" optional value={state.newsletterSubstack} onChange={(v) => update({ newsletterSubstack: v })} />
      <TextField label="Other social handle" optional value={state.otherSocialHandle} onChange={(v) => update({ otherSocialHandle: v })} />
    </Section>
  );
}

/* ─── 13. Inspiration & References ─── */
export function S13Inspiration() {
  const { state, update, isCandidate, isParty, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="13" title="Inspiration &amp; References">
      {isCandidate && (
        <>
          <TextArea label="Three campaign websites you like — why" rows={4} value={state.websitesLikedCandidate} onChange={(v) => update({ websitesLikedCandidate: v })} />
          <TextArea label="Three to avoid — why" rows={3} value={state.websitesAvoidCandidate} onChange={(v) => update({ websitesAvoidCandidate: v })} />
        </>
      )}
      {isParty && (
        <>
          <TextArea label="Three party / org websites you like — why" rows={4} value={state.websitesLikedParty} onChange={(v) => update({ websitesLikedParty: v })} />
          <TextArea label="Three to avoid — why" rows={3} value={state.websitesAvoidParty} onChange={(v) => update({ websitesAvoidParty: v })} />
        </>
      )}
      <TextField label="Brand guidelines document — link" optional value={state.brandGuidelinesUpload} onChange={(v) => update({ brandGuidelinesUpload: v })} />
    </Section>
  );
}

/* ─── 14. Press / Newsroom ─── */
export function S14Press() {
  const { state, update, updateRepeating, addRepeating, removeRepeating, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="14" title="Press &amp; Newsroom">
      <TwoCol>
        <TextField label="Press contact name" value={state.pressContactName} onChange={(v) => update({ pressContactName: v })} help="Pre-fills from Form 1 Communications Director." />
        <TextField label="Press contact email" value={state.pressContactEmail} onChange={(v) => update({ pressContactEmail: v })} />
      </TwoCol>
      <RepeatingBlock
        label="Recent press releases"
        items={state.recentPressReleases}
        onAdd={() => addRepeating('recentPressReleases', { date: '', title: '', body: '', link: '' })}
        onRemove={(i) => removeRepeating('recentPressReleases', i)}
        addLabel="Add another release"
        renderRow={(row, i) => (
          <>
            <TwoCol>
              <TextField label="Date" type="date" value={row.date} onChange={(v) => updateRepeating('recentPressReleases', i, { date: v })} />
              <TextField label="Title" value={row.title} onChange={(v) => updateRepeating('recentPressReleases', i, { title: v })} />
            </TwoCol>
            <TextArea label="Body" rows={3} value={row.body} onChange={(v) => updateRepeating('recentPressReleases', i, { body: v })} />
            <TextField label="Link" optional value={row.link} onChange={(v) => updateRepeating('recentPressReleases', i, { link: v })} />
          </>
        )}
      />
      <TextArea label="Notable media hits" optional rows={4} value={state.notableMediaHits} onChange={(v) => update({ notableMediaHits: v })} />
    </Section>
  );
}

/* ─── 16. Site Compliance + Translation ─── */
export function S16SiteCompliance() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  const showTranslation = state.pagesRequiringTranslation || state.whoProvidesTranslation;
  return (
    <Section defaultOpen index="16" title="Site Compliance Pages">
      <TwoCol>
        <RadioGroup label="Privacy Policy" value={state.privacyPolicy} onChange={(v) => update({ privacyPolicy: v })} options={PRIVACY_POLICY_STATES} />
        <RadioGroup label="Terms of Service" value={state.termsOfService} onChange={(v) => update({ termsOfService: v })} options={PRIVACY_POLICY_STATES} />
      </TwoCol>
      <Select label="Cookie consent preferences" value={state.cookieConsent} onChange={(v) => update({ cookieConsent: v })} options={COOKIE_CONSENT} />
      <TextArea label="Pages requiring translation" optional rows={2} value={state.pagesRequiringTranslation} onChange={(v) => update({ pagesRequiringTranslation: v })} help="Conditional on Form 2 Translation Needs ≠ None." />
      {(showTranslation || state.pagesRequiringTranslation) && (
        <Select label="Who provides translation?" value={state.whoProvidesTranslation} onChange={(v) => update({ whoProvidesTranslation: v })} options={TRANSLATION_PROVIDERS} />
      )}
    </Section>
  );
}

/* ─── 17. Site Structure ─── */
export function S17SiteStructure() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="17" title="Site Structure">
      <TextArea label="Required pages list" rows={4} value={state.requiredPagesList} onChange={(v) => update({ requiredPagesList: v })} help="Beyond home/about/issues/donate — press, contact, volunteer, events, news, FAQ, etc." />
    </Section>
  );
}

/* ─── 18. Email Content ─── */
export function S18EmailContent() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="18" title="Email Content">
      <TextArea label="Welcome email content" rows={4} value={state.welcomeEmailContent} onChange={(v) => update({ welcomeEmailContent: v })} help="Sent on signup." />
      <TextArea label="Drip sequence content" rows={5} value={state.dripSequenceContent} onChange={(v) => update({ dripSequenceContent: v })} help="Repeating: trigger + day offset + subject + body." />
      <TextField label="Email list segmentation" optional value={state.emailListSegmentation} onChange={(v) => update({ emailListSegmentation: v })} help="donors / volunteers / members / press" />
    </Section>
  );
}

/* ─── 19. Fundraising Page ─── */
export function S19Fundraising() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="19" title="Fundraising Page">
      <TextField label="Suggested donation tiers" value={state.donationTiers} onChange={(v) => update({ donationTiers: v })} placeholder="e.g. $25, $50, $100, $250, $500" />
      <RadioGroup label="Recurring donation default" value={state.recurringDonationDefault} onChange={(v) => update({ recurringDonationDefault: v })} options={['On', 'Off']} />
      {state.recurringDonationDefault === 'On' && (
        <Select label="Recurring frequency" value={state.recurringFrequency} onChange={(v) => update({ recurringFrequency: v })} options={RECURRING_FREQUENCY} />
      )}
      <TextArea label="Contribution-limit disclaimer text" rows={2} value={state.contributionLimitDisclaimer} onChange={(v) => update({ contributionLimitDisclaimer: v })} help="Federal/state limits — exact wording." />
      <TextArea label="Donor eligibility disclaimer text" rows={2} value={state.donorEligibilityDisclaimer} onChange={(v) => update({ donorEligibilityDisclaimer: v })} help="Citizen / not foreign national / not federal contractor." />
    </Section>
  );
}

/* ─── 20. Voter Resources (candidate) ─── */
export function S20VoterResources() {
  const { state, update, isCandidate } = useContent();
  if (!isCandidate) return null;
  return (
    <Section defaultOpen index="20" title="Voter Resources">
      <TwoCol>
        <TextField label="Polling place lookup link" optional value={state.pollingPlaceLookup} onChange={(v) => update({ pollingPlaceLookup: v })} />
        <TextField label="Voter registration deadline" type="date" value={state.voterRegDeadline} onChange={(v) => update({ voterRegDeadline: v })} />
      </TwoCol>
      <TextField label="Sample ballot link" optional value={state.sampleBallotLink} onChange={(v) => update({ sampleBallotLink: v })} />
      <TextArea label="Early voting / absentee info" rows={3} value={state.earlyVotingInfo} onChange={(v) => update({ earlyVotingInfo: v })} help="Dates + locations specific to district." />
      <TextArea label="GOTV plan content" rows={3} value={state.gotvPlanContent} onChange={(v) => update({ gotvPlanContent: v })} help="Early vote, absentee, election day messaging." />
    </Section>
  );
}

/* ─── 21. Membership Pages (party) ─── */
export function S21Membership() {
  const { state, update, isParty } = useContent();
  if (!isParty) return null;
  return (
    <Section defaultOpen index="21" title="Membership Pages">
      <TextArea label="Membership tiers & benefits" rows={5} value={state.membershipTiersBenefits} onChange={(v) => update({ membershipTiersBenefits: v })} help="Repeating: tier name + price + benefits." />
      <TextArea label="How-to-join workflow (public copy)" rows={4} value={state.howToJoinPublicCopy} onChange={(v) => update({ howToJoinPublicCopy: v })} help="Pre-filled from Form 1 application workflow; expand to public copy." />
    </Section>
  );
}

/* ─── 22. Public Governance (party) ─── */
export function S22PublicGov() {
  const { state, update, isParty } = useContent();
  if (!isParty) return null;
  return (
    <Section defaultOpen index="22" title="Public Governance">
      <SharingInstructions />
      <TwoCol>
        <TextField label="Bylaws (public version) — link" value={state.bylawsPublic} onChange={(v) => update({ bylawsPublic: v })} />
        <TextField label="Platform document (public) — link" value={state.platformDocPublic} onChange={(v) => update({ platformDocPublic: v })} />
      </TwoCol>
      <TextField label="Constitution (public) — link" optional value={state.constitutionPublic} onChange={(v) => update({ constitutionPublic: v })} />
      <TextArea label="Platform versioning" optional rows={4} value={state.platformVersioning} onChange={(v) => update({ platformVersioning: v })} help="Repeating: version + adoption date + summary of amendments." />
      <TextArea label="Resolutions archive" optional rows={4} value={state.resolutionsArchive} onChange={(v) => update({ resolutionsArchive: v })} help="Repeating: title + date + body + link." />
    </Section>
  );
}

/* ─── 23. SEO ─── */
export function S23SEO() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="23" title="SEO Inputs">
      <TextArea label="Target keywords (issue + geographic)" rows={4} value={state.targetKeywords} onChange={(v) => update({ targetKeywords: v })} help="Repeating list." />
    </Section>
  );
}

/* ─── 24. Transactional Pages ─── */
export function S24Transactional() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="24" title="Transactional Pages">
      <TextArea label="Thank-you page content" rows={4} value={state.thankYouPageContent} onChange={(v) => update({ thankYouPageContent: v })} help="Donation, signup, RSVP — copy + next-step CTA." />
    </Section>
  );
}

/* ─── 25. Volunteer ─── */
export function S25Volunteer() {
  const { state, update, subjectChosen } = useContent();
  if (!subjectChosen) return null;
  return (
    <Section defaultOpen index="25" title="Volunteer Page">
      <TextArea label="Volunteer interest categories" rows={3} value={state.volunteerCategories} onChange={(v) => update({ volunteerCategories: v })} placeholder="Phone bank, door knock, host event, lit drop, data entry, poll watcher…" />
    </Section>
  );
}
