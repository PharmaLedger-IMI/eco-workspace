import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';
import TrialsService from '../services/TrialsService.js';

export default class TrialParticipantsController extends ContainerController {
  trial = null;
  statusesArray = ['Withdrew', 'Waiting re-consent', 'Consent'];
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = [
    {
      column: 'id',
      label: 'Participant Id',
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
      column: 'site',
      label: 'Site',
      notSortable: false,
      type: 'string',
      asc: null,
      desc: null,
    },
    {
      column: 'consent',
      label: 'Consent Name',
      notSortable: false,
      type: 'string',
      asc: null,
      desc: null,
    },
    {
      column: 'consentVersion',
      label: 'Consent Version',
      notSortable: false,
      type: 'number',
      asc: null,
      desc: null,
    },
    {
      column: 'consentStatus',
      label: 'Consent Status',
      notSortable: false,
      type: 'string',
      asc: null,
      desc: null,
    },
    {
      column: 'patientSigned',
      label: 'Patient Signed',
      notSortable: false,
      type: 'date',
      asc: null,
      desc: null,
    },
    {
      column: 'hcpSigned',
      label: 'HCP Signed',
      notSortable: false,
      type: 'date',
      asc: null,
      desc: null,
    },
    {
      column: 'lastSignedICF',
      label: 'Last Signed ICF',
      notSortable: true,
      type: 'string',
    },
  ];

  countriesModel = {
    label: 'Select country',
    placeholder: 'Please select an option',
    required: false,
    options: [],
  };

  sitesModel = {
    label: 'Select Site',
    placeholder: 'Please select an option',
    required: false,
    options: [],
  };

  consentModel = {
    label: 'Select Consent Name',
    placeholder: 'Please select an option',
    required: false,
    options: [],
  };

  statusesModel = {
    label: 'Select Consent Status',
    placeholder: 'Please select an option',
    required: false,
    options: this.statusesArray.map((x) => ({
      label: x,
      value: x,
    })),
  };

  search = {
    label: 'Search participant Id',
    required: false,
    placeholder: 'Participant Id...',
    value: '',
  };

  trials = null;

  pagination = {
    previous: false,
    next: false,
    items: null,
    pages: {
      options: [],
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      options: this.itemsPerPageArray.map((x) => ({
        label: x,
        value: x,
      })),
    },
  };

  constructor(element, history) {
    super(element, history);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.setModel({
      trial: {
        id: null,
        currentParticipants: null,
        withdrewParticipants: null,
        waitingParticipants: null,
        totalParticipants: null,
        sites: [],
        consents: [],
        participants: [],
      },
      clearButtonDisabled: true,
      pagination: this.pagination,
      headers: this.headers,
      countries: this.countriesModel,
      consents: this.consentModel,
      statuses: this.statusesModel,
      sites: this.sitesModel,
      search: this.search,
    });
    let trialId = this.History.getState();

    this.model.id = trialId;

    this.attachAll();

    this.init();
  }

  async init() {
    this.trial = await this.trialsService.getTrial(this.model.id);
    this.model.trial.sites = this.trial.sites;
    this.model.trial.consents = this.trial.consents;
    this.model.trial.participants = this.trial.participants;
    this.model.trial.currentParticipants = this.trial.participants.filter((x) => x.consentStatus === 'Consent').length;
    this.model.trial.withdrewParticipants = this.trial.participants.filter(
      (x) => x.consentStatus === 'Withdrew'
    ).length;
    this.model.trial.waitingParticipants = this.trial.participants.filter(
      (x) => x.consentStatus === 'Waiting re-consent'
    ).length;
    this.model.trial.totalParticipants = this.trial.participants.length;

    const countries = [];
    this.trial.participants.forEach(
      (participant) => !countries.includes(participant.country) && countries.push(participant.country)
    );
    this.model.countries = { ...this.countriesModel, options: countries.map((x) => ({ label: x, value: x })) };

    const consents = [];
    this.trial.participants.forEach(
      (participant) =>
        !consents.some(
          (consent) => consent.name === participant.consent.name && consent.country === participant.consent.country
        ) && consents.push(participant.consent)
    );
    this.model.consents = { ...this.consentModel, options: consents.map((x) => ({ label: x.name, value: x.name })) };

    const sites = [];
    this.trial.participants.forEach(
      (participant) =>
        !sites.some((site) => site.name === participant.site.name && site.country === participant.site.country) &&
        sites.push(participant.site)
    );
    this.model.sites = { ...this.sitesModel, options: sites.map((x) => ({ label: x.name, value: x.name })) };

    this.model.trial.participants = this.trial.participants.map((participant) => ({
      ...participant,
      site: participant.site.name,
      consent: participant.consent.name,
      consentVersion: participant.consent.version,
    }));

    this.paginateParticipants(this.model.trial.participants);
  }

  setParticipantsModel(participants) {
    const model = participants.map((participant) => ({
      ...participant,
      site: participant.site.name,
      consent: participant.consent.name,
      consentVersion: participant.consent.version,
    }));
    this.model.trial.participants = model;
    this.paginateParticipants(model, 1);
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.trial.participants;

    if (this.model.countries.value) {
      result = result.filter((x) => x.country === this.model.countries.value);
    }
    if (this.model.sites.value) {
      result = result.filter((x) => x.site.name === this.model.sites.value);
    }
    if (this.model.consents.value) {
      result = result.filter((x) => x.consent.name === this.model.consents.value);
    }
    if (this.model.statuses.value) {
      result = result.filter((x) => x.consentStatus === this.model.statuses.value);
    }
    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.id === parseInt(this.model.search.value));
    }

    this.setParticipantsModel(result);
  }

  sortColumn(column) {
    if (column || this.model.headers.some((x) => x.asc || x.desc)) {
      if (!column) column = this.model.headers.find((x) => x.asc || x.desc).column;

      const headers = this.model.headers;
      const selectedColumn = headers.find((x) => x.column === column);
      const idx = headers.indexOf(selectedColumn);

      if (headers[idx].notSortable) return;

      if (headers[idx].asc || headers[idx].desc) {
        this.model.trial.participants.reverse();
        this.paginateParticipants(this.model.trial.participants, this.model.pagination.currentPage);
        this.model.headers = this.model.headers.map((x) => {
          if (x.column !== column) {
            return { ...x, asc: false, desc: false };
          } else return { ...x, asc: !headers[idx].asc, desc: !headers[idx].desc };
        });
      } else {
        this.model.trial.participants = this.model.trial.participants.sort((a, b) => (a[column] >= b[column] ? 1 : -1));
        this.paginateParticipants(this.model.trial.participants, this.model.pagination.currentPage);
        this.model.headers = this.model.headers.map((x) => {
          if (x.column !== column) {
            return { ...x, asc: false, desc: false };
          } else return { ...x, asc: true, desc: false };
        });
      }
    } else {
      this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
    }
  }

  paginateParticipants(participants, page = 1) {
    const itemsPerPage = this.model.pagination.itemsPerPage;
    const length = participants.length;
    const numberOfPages = Math.ceil(length / itemsPerPage);
    const pages = Array.from({ length: numberOfPages }, (_, i) => i + 1).map((x) => ({
      label: x,
      value: x,
      active: page === x,
    }));

    this.model.pagination.previous = page > 1 && pages.length > 1 ? false : true;
    this.model.pagination.next = page < pages.length && pages.length > 1 ? false : true;
    this.model.pagination.items = participants.slice(itemsPerPage * (page - 1), itemsPerPage * page);
    this.model.pagination.pages = {
      ...this.model.pagination.pages,
      options: pages.map((x) => ({
        label: x.label,
        value: x.value,
      })),
    };
    this.model.pagination.slicedPages =
      pages.length > 5 && page - 3 >= 0 && page + 3 <= pages.length
        ? pages.slice(page - 3, page + 2)
        : pages.length > 5 && page - 3 < 0
        ? pages.slice(0, 5)
        : pages.length > 5 && page + 3 > pages.length
        ? pages.slice(pages.length - 5, pages.length)
        : pages;
    this.model.pagination.currentPage = page;
    this.model.pagination.totalPages = pages.length;

    console.log(this.model.pagination.items);
  }

  attachAll() {
    this.model.addExpression(
      'trialNotEmpty',
      () => {
        return (
          this.model.pagination &&
          this.model.pagination.items &&
          Array.isArray(this.model.pagination.items) &&
          this.model.pagination.items.length > 0
        );
      },
      'pagination'
    );

    this.on('filters-changed', async (event) => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.on('filters-cleared', async (event) => {
      this.model.clearButtonDisabled = true;
      this.model.countries.value = null;
      this.model.sites.value = null;
      this.model.consents.value = null;
      this.model.statuses.value = null;
      this.model.search.value = null;
      this.filterData();
    });

    const searchField = this.element.querySelector('#search-field');
    searchField.addEventListener('keydown', () => {
      setTimeout(() => {
        this.model.clearButtonDisabled = false;
        this.filterData();
      }, 300);
    });

    this.on('navigate-to-page', async (event) => {
      event.preventDefault();
      this.paginateParticipants(
        this.model.trial.participants,
        event.data.value ? parseInt(event.data.value) : event.data
      );
    });

    this.on('go-to-previous-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateParticipants(this.model.trial.participants, this.model.pagination.currentPage - 1);
      }
    });

    this.on('go-to-next-page', async () => {
      if (this.model.pagination.currentPage !== this.model.pagination.totalPages) {
        this.paginateParticipants(this.model.trial.participants, this.model.pagination.currentPage + 1);
      }
    });

    this.on('go-to-last-page', async () => {
      const length = this.model.trial.participants.length;
      const numberOfPages = Math.ceil(length / this.model.pagination.itemsPerPage);
      if (this.model.pagination.currentPage !== numberOfPages) {
        this.paginateParticipants(this.model.trial.participants, numberOfPages);
      }
    });

    this.on('go-to-first-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateParticipants(this.model.trial.participants, 1);
      }
    });

    this.on('set-items-per-page', async (event) => {
      console.log(event, event.data, typeof event.data);
      this.model.pagination.itemsPerPage = parseInt(event.data.value);
      this.paginateParticipants(this.model.trial.participants, 1);
    });

    this.on('sort-column', async (event) => {
      this.sortColumn(event.data);
    });
  }
}
