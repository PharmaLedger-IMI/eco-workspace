// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { consentTableHeaders } from '../constants/consent.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
import SitesService from '../services/SitesService.js';
import ConsentService from '../services/ConsentService.js';

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialConsentsController extends WebcController {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = consentTableHeaders;

  consents = null;

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
    this.consentService = new ConsentService(this.DSUStorage);
    let { id, keySSI, uid } = this.history.location.state;

    this.model = {
      id,
      keySSI,
      uid,
      consents: [],
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
  }

  async getConsents() {
    const consents = await this.consentService.getTrialConsents(this.model.keySSI);
    console.log(JSON.parse(JSON.stringify(consents)));
    this.setConsentsModel(JSON.parse(JSON.stringify(consents)));
    this.consents = consents;
  }

  setConsentsModel(consents) {
    const model = consents.map((consent) => ({
      ...consent,
      ...consent.versions.map((x) => ({ ...x, versionDate: new Date(x.versionDate).toLocaleDateString('en-UK') }))[
        consent.versions.length - 1
      ],
    }));

    this.model.consents = model;
    this.model.data = model;
  }

  showFeedbackToast(title, message, alertType) {
    this.showErrorModal(message, title, () => {});
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => !!(this.model.consents && Array.isArray(this.model.consents) && this.model.consents.length > 0),
      'consents'
    );

    this.onTagClick('add-consent', async () => {
      this.showModalFromTemplate(
        'add-new-trial-consent',
        async (_event) => {
          // const response = event.detail;
          await this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          // this.model.sites.forEach((country) =>
          //   country.sites.forEach((site) => this.sendMessageToHco('add-trial-consent', null, 'Trial consent', site.did))
          // );
          // eventBusService.emitEventListeners(Topics.RefreshTrialConsents, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewTrialConsentModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          isUpdate: false,
          existingIds: this.model.consents.map((x) => x.id) || [],
        }
      );
    });

    this.onTagClick('add-trial-version', async (model, _target) => {
      const selectedConsent = model;
      const existingVersions = selectedConsent.versions.map((x) => x.version);

      this.showModalFromTemplate(
        'add-new-trial-consent',
        (_event) => {
          // const response = event.detail;
          this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          // this.sendMessageToHco('add-econsent-version', response.keySSI, 'New consent version', selectedSite.did);
          // eventBusService.emitEventListeners(Topics.RefreshTrialConsents, null);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewTrialConsentModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          site: null,
          isUpdate: selectedConsent,
          existingVersions: existingVersions || [],
        }
      );
    });

    this.onTagClick('view-consent-history', async (model) => {
      const selectedConsent = this.model.consents.find((x) => x.keySSI === model.keySSI);
      const data = selectedConsent.versions.map((x) => ({
        ...selectedConsent,
        ...x,
        versionDate: new Date(x.versionDate).toLocaleDateString('en-UK'),
      }));
      console.log(JSON.parse(JSON.stringify(data)));
      this.navigateToPageTag('consent-history', {
        id: this.model.id,
        keySSI: this.model.keySSI,
        uid: this.model.uid,
        data: JSON.parse(JSON.stringify(data)),
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('preview-consent', {
        id: this.model.id,
        keySSI: this.model.keySSI,
        uid: this.model.uid,
        data: model,
        history: null,
      });
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
