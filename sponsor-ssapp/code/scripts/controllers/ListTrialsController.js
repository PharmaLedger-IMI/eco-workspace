import ContainerController from '../../cardinal/controllers/base-controllers/ContainerController.js';
import { trialsService } from '../services/TrialsService.js';

export default class ListTrialsController extends ContainerController {
  statusesArray = ['Approved', 'Pending', 'Rejected'];
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = [
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
      column: 'progress',
      label: 'Progress',
      notSortable: false,
      type: 'number',
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
      column: 'enrolled',
      label: 'Enrolled',
      notSortable: false,
      type: 'number',
      asc: null,
      desc: null,
    },
    {
      column: 'total',
      label: 'Total',
      notSortable: false,
      type: 'number',
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
      column: 'started',
      label: 'Started',
      notSortable: false,
      type: 'date',
      asc: null,
      desc: null,
    },
    {
      column: null,
      label: 'View',
      notSortable: true,
      desc: null,
    },
  ];

  countriesModel = {
    label: 'Select country',
    placeholder: 'Please select an option',
    required: false,
    options: [],
  };

  statuses = {
    label: 'Select a status',
    placeholder: 'Please select an option',
    required: false,
    options: this.statusesArray.map((x) => ({
      label: x,
      value: x,
    })),
  };

  search = {
    label: 'Search for a trial',
    required: false,
    placeholder: 'Trial name...',
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

    this.trialsService = trialsService;

    this.setModel({
      statuses: this.statuses,
      countries: this.countriesModel,
      search: this.search,
      trials: [],
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    this.trials = await this.getTrials();
    const countries = [];

    this.trials.forEach((trial) =>
      trial.countries.forEach((country) => !countries.includes(country) && countries.push(country))
    );

    this.model.countries = { ...this.countriesModel, options: countries.map((x) => ({ label: x, value: x })) };

    this.model.trials = this.trials.map((trial) => ({
      ...trial,
      countries: trial.countries.join(),
      status: this.statusesArray[trial.status],
    }));
    this.paginateTrials(this.model.trials);
  }

  async getTrials() {
    try {
      const trials = await this.trialsService.getTrials();
      return trials;
    } catch (error) {
      // TODO: handle errors with pop up
      console.log(error);
    }
  }

  paginateTrials(trials, page = 1) {
    const itemsPerPage = this.model.pagination.itemsPerPage;
    const length = trials.length;
    const numberOfPages = Math.ceil(length / itemsPerPage);
    const pages = Array.from({ length: numberOfPages }, (_, i) => i + 1).map((x) => ({
      label: x,
      value: x,
      active: page === x,
    }));

    this.model.pagination.previous = page > 1 && pages.length > 1 ? false : true;
    this.model.pagination.next = page < pages.length && pages.length > 1 ? false : true;
    this.model.pagination.items = trials.slice(itemsPerPage * (page - 1), itemsPerPage * page);
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
    // this.model.pagination.pages.value = page.toString();
    console.log('TEST:', this.model.test, typeof this.model.test);

    this.model.test = '8';
    console.log('TEST:', this.model.test);
  }

  setTrialsModel(trials) {
    const model = trials.map((trial) => ({
      ...trial,
      countries: trial.countries.join(),
      status: this.statusesArray[trial.status],
    }));

    this.model.trials = model;
    this.paginateTrials(model, 1);
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.trials;
    console.log(
      'result:',
      this.model.pagination &&
        this.model.pagination.items &&
        Array.isArray(this.model.pagination.items) &&
        this.model.pagination.items.length > 0
    );

    if (this.model.countries.value) {
      result = result.filter((x) => x.countries.includes(this.model.countries.value));
    }
    if (this.model.statuses.value) {
      result = result.filter((x) => x.status === this.statusesArray.indexOf(this.model.statuses.value));
    }
    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().includes(this.model.search.value.toUpperCase()));
    }

    this.setTrialsModel(result);
  }

  sortColumn(column) {
    if (column || this.model.headers.some((x) => x.asc || x.desc)) {
      if (!column) column = this.model.headers.find((x) => x.asc || x.desc).column;

      const headers = this.model.headers;
      const selectedColumn = headers.find((x) => x.column === column);
      const idx = headers.indexOf(selectedColumn);

      if (headers[idx].notSortable) return;

      if (headers[idx].asc || headers[idx].desc) {
        this.model.trials.reverse();
        this.paginateTrials(this.model.trials, this.model.pagination.currentPage);
        this.model.headers = this.model.headers.map((x) => {
          if (x.column !== column) {
            return { ...x, asc: false, desc: false };
          } else return { ...x, asc: !headers[idx].asc, desc: !headers[idx].desc };
        });
      } else {
        this.model.trials = this.model.trials.sort((a, b) => (a[column] >= b[column] ? 1 : -1));
        this.paginateTrials(this.model.trials, this.model.pagination.currentPage);
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

  attachEvents() {
    this.model.addExpression(
      'trialArrayNotEmpty',
      () => {
        return (
          this.model.pagination &&
          this.model.pagination.items &&
          Array.isArray(this.model.pagination.items) &&
          this.model.pagination.items.length > 0
        );
      },
      'trials'
    );

    this.on('add-trial', async (event) => {
      console.log('adding trial');
      console.log(event);
    });

    this.on('view-trial', async (event) => {
      this.History.navigateToPageByTag('trial', event.data);
    });

    this.on('filters-changed', async (event) => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.on('filters-cleared', async (event) => {
      this.model.clearButtonDisabled = true;
      this.model.countries.value = null;
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
      this.paginateTrials(this.model.trials, event.data.value ? parseInt(event.data.value) : event.data);
    });

    this.on('go-to-previous-page', async () => {
      // TODO: button is clickable and fires event although disabled
      console.log('EVENT FIRED');
      if (this.model.pagination.currentPage !== 1) {
        this.paginateTrials(this.model.trials, this.model.pagination.currentPage - 1);
      }
    });

    this.on('go-to-next-page', async () => {
      if (this.model.pagination.currentPage !== this.model.pagination.totalPages) {
        this.paginateTrials(this.model.trials, this.model.pagination.currentPage + 1);
      }
    });

    this.on('go-to-last-page', async () => {
      const length = this.model.trials.length;
      const numberOfPages = Math.ceil(length / this.model.pagination.itemsPerPage);
      if (this.model.pagination.currentPage !== numberOfPages) {
        this.paginateTrials(this.model.trials, numberOfPages);
      }
    });

    this.on('go-to-first-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateTrials(this.model.trials, 1);
      }
    });

    this.on('set-items-per-page', async (event) => {
      console.log(event, event.data, typeof event.data);
      this.model.pagination.itemsPerPage = parseInt(event.data.value);
      this.paginateTrials(this.model.trials, 1);
    });

    this.on('sort-column', async (event) => {
      this.sortColumn(event.data);
    });
  }
}
