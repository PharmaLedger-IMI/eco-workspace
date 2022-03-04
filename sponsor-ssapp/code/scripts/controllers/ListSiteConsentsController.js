// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { siteConsentTableHeaders } from '../constants/consent.js';
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const { getDidServiceInstance } = commonServices.DidService;
import SitesService from '../services/SitesService.js';
import ConsentService from '../services/ConsentService.js';

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialConsentsController extends WebcController {
  itemsPerPageArray = [5, 10, 15, 20, 30];

  headers = siteConsentTableHeaders;

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
    let { trialId, trialKeySSI, siteKeySSI, siteId } = this.history.location.state;

    this.model = {
      trialId,
      trialKeySSI,
      siteKeySSI,
      siteId,
      site: null,
      consents: [],
      trialConsents: [],
      data: null,
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
    };

    this.didService = getDidServiceInstance();
    this.didService.getDID().then((did) => {
      this.model.did = did;
    });

    this.feedbackEmitter = null;

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
  }

  async getConsents() {
    this.model.trialConsents = await this.consentService.getTrialConsents(this.model.trialKeySSI);
    console.log(JSON.parse(JSON.stringify(this.model.trialConsents)));
    const site = await this.sitesService.getSite(this.model.siteKeySSI);
    console.log(JSON.parse(JSON.stringify(site)));
    const model = this.getSiteConsents(site);
    this.model.site = site;
    this.model.data = model;
    this.model.consents = model;
  }

  getSiteConsents(site) {
    const consents = JSON.parse(JSON.stringify(this.model.trialConsents));
    if (!site.consents || site.consents.length === 0) {
      const result = consents.map((x) => ({
        type: x.type,
        trialConsentKeySSI: x.keySSI,
        trialConsentName: x.name,
        versions: [],
        trialConsentVersion: Math.max.apply(
          Math,
          x.versions.map((o) => parseInt(o.version))
        ),
        version: null,
        versionDate: null,
        attachment: null,
        id: x.id,
        name: null,
      }));
      return result;
    } else {
      const result = consents.map((x) => {
        const exists = site.consents.find((y) => y.trialConsentKeySSI === x.keySSI);
        if (exists) {
          return {
            ...exists,
            ...exists.versions.map((x) => ({ ...x, versionDate: new Date(x.versionDate).toLocaleDateString('en-UK') }))[
              exists.versions.length - 1
            ],
            trialConsentVersion: Math.max.apply(
              Math,
              x.versions.map((o) => parseInt(o.version))
            ),
          };
        } else {
          return {
            type: x.type,
            trialConsentKeySSI: x.keySSI,
            trialConsentName: x.name,
            versions: [],
            trialConsentVersion: Math.max.apply(
              Math,
              x.versions.map((o) => parseInt(o.version))
            ),
            id: x.id,
            name: null,
            version: null,
            versionDate: null,
            attachment: null,
          };
        }
      });
      return result;
    }
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => !!(this.model.data && Array.isArray(this.model.data) && this.model.data.length > 0),
      'data'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagClick('add-site-consent', async (model) => {
      console.log(model);

      const selectedConsent = JSON.parse(
        JSON.stringify(this.model.trialConsents.find((x) => x.keySSI === model.trialConsentKeySSI))
      );
      console.log(selectedConsent);

      this.showModalFromTemplate(
        'add-new-site-consent',
        async (_event) => {
          // const response = event.detail;
          await this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          // this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_CONSENT, response.keySSI, 'Trial consent', selectedSite.did);
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewSiteConsentModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          site: JSON.parse(JSON.stringify(this.model.site)),
          selectedConsent,
          consents: JSON.parse(JSON.stringify(this.model.trialConsents)),
        }
      );
    });

    this.onTagClick('view-site-consent-history', async (model) => {
      console.log(model);
      const selectedConsent = this.model.data.find((x) => x.keySSI === model.keySSI);
      const data = selectedConsent.versions.map((x) => ({
        ...selectedConsent,
        ...x,
        versionDate: new Date(x.versionDate).toLocaleDateString('en-UK'),
      }));
      console.log(JSON.parse(JSON.stringify(data)));
      this.navigateToPageTag('site-consent-history', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        siteId: this.model.siteId,
        siteKeySSI: this.model.siteKeySSI,
        data: JSON.parse(JSON.stringify(data)),
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('site-preview-consent', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        siteId: this.model.siteId,
        siteKeySSI: this.model.siteKeySSI,
        data: model,
        history: null,
      });
    });

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
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
