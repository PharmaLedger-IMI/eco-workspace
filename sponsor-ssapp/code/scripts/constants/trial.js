export const trialStatusesEnum = {
  Active: 'Active',
  OnHold: 'On Hold',
  Cancelled: 'Cancelled',
};

export const trialStagesEnum = {
  Created: 'Created',
  Submission: 'Submission',
  Initiated: 'Initiated',
  Recruiting: 'Recruiting',
  Enrolling: 'Enrolling',
  Conducting: 'Conducting',
  Completed: 'Completed',
};

export const trialTableHeaders = [
  {
    column: 'id',
    label: 'Trial Number / ID',
    notSortable: false,
    type: 'number',
    asc: null,
    desc: null,
  },
  {
    column: 'name',
    label: 'Trial Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'created',
    label: 'Created',
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
    column: null,
    label: 'Options',
    notSortable: true,
    desc: null,
  },
];
