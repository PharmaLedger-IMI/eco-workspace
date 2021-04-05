export const trialStatusesEnum = {
  Active: 'Active',
  OnHold: 'On-hold',
  Postponed: 'Postponed',
  Completed: 'Completed',
};

export const trialTableHeaders = [
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
    label: 'Trial Name',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'status',
    label: 'EC Status',
    notSortable: false,
    type: 'string',
    asc: null,
    desc: null,
  },
  {
    column: 'countries',
    label: 'Countries',
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
