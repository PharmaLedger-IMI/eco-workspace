// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { trialStatusesEnum, trialTableHeaders, trialStagesEnum } from '../constants/trial.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const MessageHandlerService = commonServices.MessageHandlerService;
const Constants = commonServices.Constants;
import ParticipantsService from '../services/ParticipantsService.js';
import SitesService from '../services/SitesService.js';

import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';
import { senderType } from '../constants/participant.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialsController extends WebcController {
  statusesArray = Object.entries(trialStatusesEnum).map(([_k, v]) => v);
  stagesArray = Object.entries(trialStagesEnum).map(([_k, v]) => v);
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
      selectOptions: this.itemsPerPageArray.map((x) => ({ value: x, label: x })),
      value: this.itemsPerPageArray[1].value,
    },
  };

  constructor(...props) {
    super(...props);

    this.trialsService = new TrialsService(this.DSUStorage);
    this.participantsService = new ParticipantsService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);

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

    this.listenForMessages();

    this.attachEvents();

    this.init();
  }

  listenForMessages() {
    MessageHandlerService.init(async (err, data) => {
      if (err) {
        return console.error(err);
      }
      console.log('DATA MESSAGE:', data);
      data = JSON.parse(data);
      debugger;
      switch (data.operation) {
        case Constants.MESSAGES.SPONSOR.SIGN_ECOSENT:
        case Constants.MESSAGES.SPONSOR.UPDATE_ECOSENT: {
          await this.participantsService.updateParticipant(data.useCaseSpecifics, data.ssi, data.senderIdentity);
          eventBusService.emitEventListeners(Topics.RefreshParticipants + data.useCaseSpecifics.trialSSI, data);
          break;
        }
        case 'update-site-status': {
          debugger;
          if (data.stageInfo.siteSSI) {
            await this.sitesService.updateSiteStage(data.stageInfo.siteSSI);
          }
        }
        case 'tp-added': {
          debugger;
          if (data.ssi) {
            await this.participantsService.addParticipant(data.ssi, data.senderIdentity);
          }
        }
      }
    });
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

  setTrialsModel(trials) {
    const model = trials
      .map((trial) => ({
        ...trial,
        created: new Date(trial.created).toLocaleDateString('en-UK'),
      }))
      .sort((a, b) => a.id - b.id);

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
    this.showErrorModal(message, title, () => {});
  }

  attachEvents() {
    this.model.onChange('statuses.value', () => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.model.onChange('stages.value', () => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.model.onChange('search.value', () => {
      this.model.clearButtonDisabled = false;
      this.filterData();
    });

    this.model.addExpression(
      'trialArrayNotEmpty',
      () => !!(this.model.trials && Array.isArray(this.model.trials) && this.model.trials.length > 0),
      'trials'
    );

    this.on('run-filters', () => {
      this.filterData();
    });

    this.onTagClick('add-trial', async () => {
      this.showModalFromTemplate(
        'add-new-trial',
        () => {
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
          disableBackdropClosing: true,
          existingIds: this.trials.map((x) => x.id) || [],
        }
      );
    });

    // this.on('delete-trial', async (event) => {
    //   try {
    //     const trial = await this.trialsService.getTrialFromDB(event.data);
    //     const sites = await this.sitesService.getSites(trial.keySSI);
    //     await this.trialsService.deleteTrial(event.data);
    //     this.showFeedbackToast('Result', 'Trial deleted successfully', 'toast');
    //     this.getTrials();
    //     sites.forEach((site) => {
    //       this.sendMessageToHco('delete-trial', event.data, 'the trial was removed ', site.did);
    //     });
    //   } catch (error) {
    //     this.showFeedbackToast('Result', 'ERROR: The was an error, trial cannot be deleted right now', 'toast');
    //   }
    // });

    this.onTagClick('view-trial-sites', async (model) => {
      this.navigateToPageTag('sites', {
        id: model.id,
        keySSI: model.keySSI,
        uid: model.uid,
      });
    });

    this.onTagClick('view-trial-visits', async (model) => {
      this.navigateToPageTag('trial-visits', {
        id: model.id,
        keySSI: model.keySSI,
        uid: model.uid,
      });
    });

    this.onTagClick('view-trial-consents', async (model) => {
      this.navigateToPageTag('trial-consents', {
        id: model.id,
        keySSI: model.keySSI,
        uid: model.uid,
      });
    });

    this.onTagClick('view-trial-status', async (model) => {
      this.showModalFromTemplate(
        'add-new-trial-status',
        async (event) => {
          await this.updateSiteStatuses(event.detail);
          await this.getTrials();
          this.showFeedbackToast('Result', 'Trial status changed successfully', 'toast');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new trial', 'toast');
          }
        },
        {
          controller: 'AddNewTrialStatusModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          trial: model,
        }
      );
    });

    this.onTagClick('filters-cleared', async () => {
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

  sendMessageToHco(operation, ssi, shortMessage, receiverDid) {
    let communicationService = getCommunicationServiceInstance();
    communicationService.sendMessage(receiverDid, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }

  async updateSiteStatuses(trial) {
    const sites = await this.sitesService.getSites(trial.keySSI);

    for (const site of sites) {
      await this.sitesService.changeSiteStatus(trial.status, site.did, trial.keySSI);
      this.sendMessageToHco(Constants.MESSAGES.SPONSOR.UPDATE_SITE_STATUS, site.uid, 'Status updated', site.did);
    }
    return;
  }
}
