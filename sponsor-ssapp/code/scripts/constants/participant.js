export const participantConsentStatusEnum = {
  Consent: 'Consent',
  WaitingReConsent: 'Waiting re-consent',
  Withdrew: 'Withdrew',
};

export const trialTableHeaders = [
  {
    column: 'participantId',
    label: 'Participant Id',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'consentName',
    label: 'Last Inform Consent Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'consentVersion',
    label: 'Last ICF version',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'consentStatus',
    label: 'Last ICF status',
    notSortable: false,
    type: 'string',
    desc: null,
  },
  {
    column: 'patientSignature',
    label: 'Last ICF patient or presentative signature',
    notSortable: false,
    type: 'string',
    desc: null,
  },
  {
    column: 'doctorSignature',
    label: 'Last ICF HCP signature',
    notSortable: false,
    type: 'string',
    desc: null,
  },
];

export const senderType = {
  HCP: 'hcp',
  Patient: 'patient',
};
