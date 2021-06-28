import TrialsService from '../services/TrialsService.js';
import { trialStatusesEnum, trialTableHeaders, trialStagesEnum } from '../constants/trial.js';
import CommunicationService from '../services/CommunicationService.js';
import ParticipantsService from '../services/ParticipantsService.js';

import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';
import { senderType } from '../constants/participant.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialsController extends WebcController {
  statusesArray = Object.entries(trialStatusesEnum).map(([k, v]) => v);
  stagesArray = Object.entries(trialStagesEnum).map(([k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = trialTableHeaders;

  // countries = {
  //   label: 'Select country',
  //   placeholder: 'Please select an option',
  //   required: false,
  //   options: [],
  // };

  statuses = {
    label: 'Select a status',
    placeholder: 'Please select an option',
    required: false,
    options: this.statusesArray.map((x) => ({
      label: x,
      value: x,
    })),
  };

  stages = {
    label: 'Select a stage',
    placeholder: 'Please select an option',
    required: false,
    options: this.stagesArray.map((x) => ({
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
      selectOptions: '',
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      selectOptions: this.itemsPerPageArray.join(' | '),
      value: this.itemsPerPageArray[1].toString(),
    },
  };

  constructor(...props) {
    super(...props);

    this.trialsService = new TrialsService(this.DSUStorage);
    this.participantsService = new ParticipantsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);
    this.CommunicationService.listenForMessages(async (err, data) => {
      if (err) {
        return console.error(err);
      }
      data = JSON.parse(data);
      console.log('DATA MEESAGE:', data);
      switch (data.message.operation) {
        case 'sign-econsent':
        case 'update-econsent': {
          await this.participantsService.updateParticipant(
            {
              participantId: data.message.useCaseSpecifics.tpNumber,
              action: data.message.useCaseSpecifics.action,
              trialSSI: data.message.useCaseSpecifics.trialSSI,
              consentSSI: data.message.ssi,
              version: data.message.useCaseSpecifics.version,
              type: data.sender === 'hcoIdentity' ? senderType.HCP : senderType.Patient,
              operationDate: data.message.useCaseSpecifics.operationDate || null,
            },
            data.message.useCaseSpecifics.trialSSI
          );
        }
      }
      eventBusService.emitEventListeners(Topics.RefreshParticipants + data.message.useCaseSpecifics.trialSSI, data);
    });
    this.feedbackEmitter = null;

    this.model = {
      statuses: this.statuses,
      stages: this.stages,
      // countries: this.countries,
      search: this.search,
      trials: [],
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'trials',
      tableLength: 7,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getTrials();
  }

  async getTrials() {
    try {
      this.trials = await this.trialsService.getTrials();
      // this.updateCountryOptions(this.trials);
      this.setTrialsModel(this.trials);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR', 'There was an issue accessing trials object', 'toast');
    }
  }

  // updateCountryOptions(trials) {
  //   const countries = [];

  //   trials.forEach((trial) =>
  //     trial.countries.forEach((country) => !countries.includes(country) && countries.push(country))
  //   );

  //   this.model.countries = { ...this.countries, options: countries.map((x) => ({ label: x, value: x })) };
  // }

  setTrialsModel(trials) {
    const model = trials.map((trial) => ({
      ...trial,
      // countries: trial.countries.join(),
    }));

    this.model.trials = model;
    this.model.data = model;
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.trials;

    // if (this.model.countries.value) {
    //   result = result.filter((x) => x.countries.includes(this.model.countries.value));
    // }
    if (this.model.statuses.value) {
      result = result.filter((x) => x.status === this.model.statuses.value);
    }
    if (this.model.stages.value) {
      result = result.filter((x) => x.stage === this.model.stages.value);
    }
    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
    }

    this.setTrialsModel(result);
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  attachEvents() {
    this.model.addExpression(
      'trialArrayNotEmpty',
      () => this.model.trials && Array.isArray(this.model.trials) && this.model.trials.length > 0,
      'trials'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.on('run-filters', (e) => {
      this.filterData();
    });

    this.onTagClick('add-trial', async (event) => {
      this.showModalFromTemplate(
        'add-new-trial',
        (event) => {
          const response = event.detail;
          this.getTrials();
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
          disableExpanding: false,
          disableBackdropClosing: false,
          existingIds: this.trials.map((x) => x.id) || [],
        }
      );
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
      // this.model.countries.value = null;
      this.model.statuses.value = null;
      this.model.stages.value = null;
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
  }

  sendMessageToHco(operation, ssi, shortMessage) {
    this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
