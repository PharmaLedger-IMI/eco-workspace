export const consentTypeEnum = {
  Mandatory: 'Mandatory',
  Optional: 'Optional',
};

export const consentTableHeaders = [
  {
    column: 'id',
    label: 'Id',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'name',
    label: 'Consent Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'version',
    label: 'Version',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'versionDate',
    label: 'Date',
    notSortable: false,
    desc: null,
  },
  {
    column: 'type',
    label: 'Type',
    notSortable: false,
    desc: null,
  },
  {
    column: 'attachment',
    label: 'Attachment',
    notSortable: false,
    desc: null,
  },
  {
    column: null,
    label: 'Controls',
    notSortable: true,
    desc: null,
  },
];
