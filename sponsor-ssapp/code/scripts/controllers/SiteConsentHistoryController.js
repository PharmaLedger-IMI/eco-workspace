// eslint-disable-next-line no-undef
import { siteConsentTableHeaders } from '../constants/consent.js';

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class SiteConsentHistoryController extends WebcController {
  headers = siteConsentTableHeaders;

  consents = null;

  constructor(...props) {
    super(...props);
    let { trialId, trialKeySSI, trialUid, siteId, siteKeySSI, siteUid, data } = this.history.location.state;

    data = data.map((x) => ({
      ...x,
      siteConsentNameVer: `${x.name}, ver. ${x.version}`,
      trialConsentNameVer: `${x.trialConsentName}, ver. ${x.trialConsentVersion}`,
    }));

    this.model = {
      trialId,
      trialKeySSI,
      trialUid,
      siteId,
      siteKeySSI,
      siteUid,
      data,
      headers: this.headers,
    };

    this.attachEvents();

    this.init();
  }

  async init() {}

  attachEvents() {
    this.onTagClick('navigate-to-consents', async () => {
      this.navigateToPageTag('site-consents', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
      });
    });

    this.onTagClick('navigate-to-sites', async () => {
      this.navigateToPageTag('sites', {
        id: this.model.trialId,
        keySSI: this.model.trialKeySSI,
        uid: this.model.trialUid,
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('site-preview-consent', {
        trialId: this.model.trialId,
        trialKeySSI: this.model.trialKeySSI,
        trialUid: this.model.trialUid,
        siteKeySSI: this.model.siteKeySSI,
        siteId: this.model.siteId,
        siteUid: this.model.siteUid,
        data: model,
        history: JSON.parse(JSON.stringify(this.model.data)),
      });
    });
  }
}
