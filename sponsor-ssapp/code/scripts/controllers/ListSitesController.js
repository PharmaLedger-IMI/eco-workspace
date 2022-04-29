// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { siteStatusesEnum, siteStagesEnum, siteTableHeaders } from '../constants/site.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const Constants = commonServices.Constants;
import SitesService from '../services/SitesService.js';

import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListSitesController extends WebcController {
  statusesArray = Object.entries(siteStatusesEnum).map(([_k, v]) => v);
  stagesArray = Object.entries(siteStagesEnum).map(([_k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = siteTableHeaders;

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
    label: 'Search for a site',
    required: false,
    placeholder: 'Site name...',
    value: '',
  };

  sites = null;

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
    this.sitesService = new SitesService(this.DSUStorage);
    let { id, keySSI, uid } = this.history.location.state;

    this.model = {
      id,
      keySSI,
      uid,
      statuses: this.statuses,
      stages: this.stages,
      countries: this.countries,
      search: this.search,
      trials: [],
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'sites',
      tableLength: 7,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getSites();
  }

  async getTrial() {
    this.model.trial = await this.trialsService.getTrialFromDB(this.model.id);
  }

  async getSites() {
    if (!this.model.trial) {
      await this.getTrial();
    }
    const sites = (await this.sitesService.getSites(this.model.trial.keySSI)).map((x) => ({
      ...x,
      active: x.status === siteStatusesEnum.Active,
      terminated: !(x.status === siteStatusesEnum.Cancelled),
      onHold: x.status === siteStatusesEnum.OnHold,
    }));

    this.sites = sites;
    this.setSitesModel(sites);
  }

  setSitesModel(sites) {
    const model = sites.map((site) => ({
      ...site,
      created: new Date(site.created).toLocaleDateString('en-UK'),
    }));

    this.model.sites = model;
    this.model.data = model;
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.sites;

    if (this.model.countries.value) {
      result = result.filter((x) => x.countries.includes(this.model.countries.value));
    }
    if (this.model.statuses.value) {
      result = result.filter((x) => x.status === this.model.statuses.value);
    }
    if (this.model.stages.value) {
      result = result.filter((x) => x.stage === this.model.stages.value);
    }
    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
    }

    this.setSitesModel(result);
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
      'sitesArrayNotEmpty',
      () => !!(this.model.sites && Array.isArray(this.model.sites) && this.model.sites.length > 0),
      'sites'
    );

    this.on('run-filters', () => {
      this.filterData();
    });

    this.onTagClick('add-site', async () => {
      console.log(JSON.stringify(this.model.sites, null, 2));
      this.showModalFromTemplate(
        'add-new-site',
        (event) => {
          const response = event.detail;
          this.getSites();
          this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_SITE, response.keySSI, 'Site added', response.did);
          this.showFeedbackToast('Result', 'Site added successfully', 'toast');
          eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new site', 'toast');
          }
        },
        {
          controller: 'AddNewSiteModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          existingIds: _.flatten(this.model.sites.map((y) => y.id)) || [],
          existingDids: _.flatten(this.model.sites.map((y) => y.did)) || [],
          trialKeySSI: this.model.trial.keySSI,
        }
      );
    });

    this.onTagClick('edit-site-contact', async (model) => {
      console.log(JSON.stringify(model));
      this.showModalFromTemplate(
        'edit-site-contact',
        (event) => {
          const response = event.detail;
          this.getSites();
          this.sendMessageToHco(Constants.MESSAGES.SPONSOR.UPDATE_SITE, response.uid, 'Site updated', response.did);
          this.showFeedbackToast('Result', 'Site added successfully', 'toast');
          eventBusService.emitEventListeners(Topics.RefreshTrialDetails, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new site', 'toast');
          }
        },
        {
          controller: 'EditSiteContactModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          site: model,
        }
      );
    });

    this.onTagClick('view-site-consents', async (model) => {
      console.log(model);
      this.navigateToPageTag('site-consents', {
        trialId: this.model.id,
        trialKeySSI: this.model.keySSI,
        trialUid: this.model.uid,
        siteKeySSI: model.keySSI,
        siteId: model.id,
        siteUid: model.uid,
      });
    });

    this.onTagClick('filters-cleared', async () => {
      this.model.clearButtonDisabled = true;
      this.model.countries.value = null;
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
}
