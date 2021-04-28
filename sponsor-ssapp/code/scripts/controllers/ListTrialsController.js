import TrialsService from '../services/TrialsService.js';
import { trialStatusesEnum, trialTableHeaders } from '../constants/trial.js';
import CommunicationService from '../services/CommunicationService.js';
import ParticipantsService from '../services/ParticipantsService.js';

import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';
import { senderType } from '../constants/participant.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialsController extends WebcController {
  statusesArray = Object.entries(trialStatusesEnum).map(([k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = trialTableHeaders;

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
    this.participantsService = new ParticipantsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);
    this.CommunicationService.listenForMessages(async (err, data) => {
      if (err) {
        return console.error(err);
      }
      data = JSON.parse(data);
      switch (data.message.operation) {
        case 'sign-econsent': {
          switch (data.sender) {
            case CommunicationService.identities.PATIENT_IDENTITY: {
              console.log('PATIENT_IDENTITY', data);
              if (data.message.operation === 'sign-econsent') {
                const list = await this.participantsService.updateParticipant(
                  {
                    participantId: data.message.useCaseSpecifics.tpNumber,
                    operationDate: data.message.useCaseSpecifics.operationDate,
                    trialSSI: data.message.useCaseSpecifics.trialSSI,
                    consentSSI: data.message.ssi,
                    type: data.sender === 'hcoIdentity' ? senderType.HCP : senderType.Patient,
                  },
                  data.message.useCaseSpecifics.trialSSI
                );

                console.log(list);
                eventBusService.emitEventListeners(
                  Topics.RefreshParticipants + data.message.useCaseSpecifics.trialSSI,
                  data
                );
              }
              break;
            }
            case CommunicationService.identities.HCO_IDENTITY: {
              if (data.message.operation === 'sign-econsent') {
                const list = await this.participantsService.updateParticipant(
                  {
                    participantId: data.message.useCaseSpecifics.tpNumber,
                    operationDate: data.message.useCaseSpecifics.operationDate,
                    trialSSI: data.message.useCaseSpecifics.trialSSI,
                    consentSSI: data.message.ssi,
                    type: data.sender === 'hcoIdentity' ? senderType.HCP : senderType.Patient,
                  },
                  data.message.useCaseSpecifics.trialSSI
                );

                console.log(list);

                eventBusService.emitEventListeners(
                  Topics.RefreshParticipants + data.message.useCaseSpecifics.trialSSI,
                  data
                );
              }
              console.log('HCO_IDENTITY', data);
              break;
            }
          }
        }
      }
    });
    this.feedbackEmitter = null;

    this.setModel({
      statuses: this.statuses,
      countries: this.countries,
      search: this.search,
      trials: [],
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
    });

    console.log(this.model.statuses.options);

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getTrials();
    this.paginateTrials(this.model.trials);
  }

  async getTrials() {
    try {
      this.trials = await this.trialsService.getTrials();
      this.updateCountryOptions(this.trials);
      this.setTrialsModel(this.trials);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR: There was an issue accessing trials object', 'Result', 'toast');
    }
  }

  updateCountryOptions(trials) {
    const countries = [];

    trials.forEach((trial) =>
      trial.countries.forEach((country) => !countries.includes(country) && countries.push(country))
    );

    this.model.countries = { ...this.countries, options: countries.map((x) => ({ label: x, value: x })) };
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
    // console.log('TEST:', this.model.test, typeof this.model.test);

    // this.model.test = '8';
    // console.log('TEST:', this.model.test);
  }

  setTrialsModel(trials) {
    const model = trials.map((trial) => ({
      ...trial,
      countries: trial.countries.join(),
    }));

    this.model.trials = model;
    this.paginateTrials(model, 1);
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    console.log(this.model.statuses.value);
    let result = this.trials;

    if (this.model.countries.value) {
      result = result.filter((x) => x.countries.includes(this.model.countries.value));
    }
    if (this.model.statuses.value) {
      result = result.filter((x) => x.status === this.model.statuses.value);
    }
    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
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

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
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

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagClick('add-trial', async (event) => {
      this.showModalFromTemplate(
        'add-new-trial',
        (event) => {
          const response = event.detail;
          this.getTrials();
          // this.sendMessageToHco('add-trial', response.keySSI, 'New trial' + response.id);
          this.showFeedbackToast('Result', 'Trial added successfully', 'toast');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new trial', 'toast');
          }
        },
        {
          controller: 'AddNewTrialModalController',
          disableExpanding: true,
          disableBackdropClosing: false,
        }
      );

      // this.createWebcModal({
      //   template: 'add-new-trial',
      //   controller: 'AddNewTrialModalController',
      //   disableBackdropClosing: true,
      //   disableFooter: true,
      //   disableHeader: false,
      //   disableExpanding: true,
      //   disableClosing: false,
      //   disableCancelButton: true,
      //   expanded: false,
      //   centered: true,
      // });
    });

    this.on('delete-trial', async (event) => {
      try {
        await this.trialsService.deleteTrial(event.data);
        this.showFeedbackToast('Result', 'Trial deleted successfully', 'toast');
        this.getTrials();
        this.sendMessageToHco('delete-trial', event.data, 'the trial was removed ');
      } catch (error) {
        this.showFeedbackToast('Result', 'ERROR: The was an error, trial cannot be deleted right now', 'toast');
      }
    });

    this.on('view-trial', async (event) => {
      console.log(this.trials.find((x) => x.id === event.data));
      this.navigateToPageTag('trial', {
        id: event.data,
        keySSI: this.trials.find((x) => x.id === event.data).keySSI,
      });
    });

    this.on('filters-changed', async (event) => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.onTagClick('filters-cleared', async (event) => {
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
      this.model.pagination.itemsPerPage = parseInt(event.data.value);
      this.paginateTrials(this.model.trials, 1);
    });

    this.on('sort-column', async (event) => {
      this.sortColumn(event.data);
    });
  }

  sendMessageToHco(operation, ssi, shortMessage) {
    console.log('SENDING MESSAGE');
    this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
