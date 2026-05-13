export const SUBJECT_TYPES = [
  { id: 'candidate', label: 'Candidate',         desc: 'Individual running for office' },
  { id: 'party',     label: 'Party / Movement',  desc: 'Party, coalition, or movement' },
  { id: 'nonprofit', label: 'Nonprofit',         desc: '501(c)(3) / (c)(4) / (c)(6) / 527 / other' },
  { id: 'pac',       label: 'PAC',               desc: 'Federal / State / Super / Hybrid / Carey / Leadership' },
];

export const NONPROFIT_TYPES = ['501(c)(3)', '501(c)(4)', '501(c)(6)', '527', 'PAC (separate)', 'Super PAC (separate)', 'Other'];
export const NONPROFIT_SCOPES = ['National', 'Multi-State', 'Statewide', 'Local'];
export const PAC_TYPES = ['Federal', 'State', 'Super PAC', 'Hybrid', 'Carey', 'Leadership', 'Other'];
export const PAC_SCOPES = ['Federal', 'Multi-State', 'Statewide', 'Local'];
export const FEC_FILING_FREQUENCY = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'On Election Schedule', 'N/A'];
export const IRS_DETERMINATION_STATUS = ['Determined', 'Pending', 'Not yet filed', 'N/A'];
export const LOBBYING_ACTIVITY = ['None', 'Limited (within IRS thresholds)', 'Substantial', '501(h) election in effect', 'N/A'];

export const YES_NO = ['Yes', 'No'];
export const YES_NO_PARTIAL = ['Yes', 'No', 'Partial'];
export const YES_NO_NA = ['Yes', 'No', 'N/A'];

export const RECURRING_FREQUENCY = ['Monthly', 'Weekly', 'Quarterly', 'Other'];

export const PRIVACY_POLICY_STATES = ['Have one', 'Need draft', 'Not applicable'];

export const COOKIE_CONSENT = ['GDPR', 'CCPA', 'Basic banner', 'None'];

export const TRANSLATION_NEEDS = ['None', 'Spanish', 'Other'];
export const TRANSLATION_PROVIDERS = ['Client provides translated copy', 'Op1776 to translate', 'Auto-translate widget'];

export const HOSTING_PREFERENCE = ['YouTube', 'Vimeo', 'Self-hosted', 'Other'];
