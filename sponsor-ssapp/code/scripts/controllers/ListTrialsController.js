import ContainerController from '../../cardinal/controllers/base-controllers/ContainerController.js';
import ListTrialsService from '../services/ListTrialsService.js';

export default class DebugLogController extends ContainerController {
  statusesArray = ['Approved', 'Pending', 'Rejected'];

  countries = {
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

  constructor(element, history) {
    super(element, history);

    this.listTrialsService = new ListTrialsService();

    this.trials = this.getTrials();
    const countries = [];

    this.trials.forEach((trial) =>
      trial.countries.forEach((country) => !countries.includes(country) && countries.push(country))
    );

    this.setModel({
      statuses: this.statuses,
      countries: { ...this.countries, options: countries.map((x) => ({ label: x, value: x })) },
      trials: this.trials.map((trial) => ({
        ...trial,
        countries: trial.countries.join(),
        status: this.statusesArray[trial.status],
      })),
      search: this.search,
    });

    this.attachEvents();
  }

  getTrials() {
    return this.listTrialsService.getTrials();
  }

  setTrialsModel(trials) {
    const model = trials.map((trial) => ({
      ...trial,
      countries: trial.countries.join(),
      status: this.statusesArray[trial.status],
    }));

    this.model.trials = [...model];
  }

  filterData() {
    console.log('filtering...:', this.selectedFilters);
    let result = this.trials;

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

  attachEvents() {
    this.model.addExpression(
      'trialArrayLoaded',
      () => {
        return typeof this.model.logs !== 'undefined';
      },
      'logs'
    );

    this.model.addExpression(
      'trialArrayNotEmpty',
      () => {
        return typeof this.model.trials !== 'undefined' && this.model.trials.length > 0;
      },
      'logs'
    );

    this.on('add-trial', async (event) => {
      console.log('adding trial');
      console.log(event);
    });

    this.on('view-trial', async (event) => {
      console.log('viewing trial');
      console.log(event);
    });

    this.on('filters-changed', async (event) => {
      this.filterData();
    });

    this.on('filters-cleared', async (event) => {
      this.model.countries.value = null;
      this.model.statuses.value = null;
      this.model.search.value = null;
      this.filterData();
    });

    const searchField = this.element.querySelector('#search-field');
    searchField.addEventListener('keydown', () => {
      console.log('key pressed');
      setTimeout(() => {
        this.filterData();
      }, 300);
    });
  }
}
