// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import { siteConsentTableHeaders } from '../constants/consent.js';
const { getDidServiceInstance } = commonServices.DidService;

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class SiteConsentHistoryController extends WebcController {
  headers = siteConsentTableHeaders;

  consents = null;

  constructor(...props) {
    super(...props);
    let { trialId, trialKeySSI, siteId, siteKeySSI, data } = this.history.location.state;

    this.model = {
      trialId,
      trialKeySSI,
      siteId,
      siteKeySSI,
      data,
      headers: this.headers,
    };

    this.didService = getDidServiceInstance();
    this.didService.getDID().then((did) => {
      this.model.did = did;
    });

    this.feedbackEmitter = null;

    this.attachEvents();

    this.init();
  }

  async init() {}

  attachEvents() {
    this.onTagClick('navigate-to-consents', async () => {
      this.navigateToPageTag('site-consents', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
      });
    });

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('site-preview-consent', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        data: model,
        history: JSON.parse(JSON.stringify(this.model.data)),
      });
    });
  }
}
