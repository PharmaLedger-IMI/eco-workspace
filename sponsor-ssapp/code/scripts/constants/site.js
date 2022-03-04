export const siteStatusesEnum = {
  Active: 'Active',
  OnHold: 'On Hold',
  Cancelled: 'Cancelled',
};

export const siteStagesEnum = {
  Created: 'Created',
  Submission: 'Submission',
  Initiated: 'Initiated',
  Recruiting: 'Recruiting',
  Enrolling: 'Enrolling',
  Conducting: 'Conducting',
  Completed: 'Completed',
};

export const siteTableHeaders = [
  {
    column: 'name',
    label: 'Site Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'id',
    label: 'Site Number/ID',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'country',
    label: 'Country',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'status',
    label: 'Status',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'stage',
    label: 'Stage',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'did',
    label: 'Contact Data',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  },
];
