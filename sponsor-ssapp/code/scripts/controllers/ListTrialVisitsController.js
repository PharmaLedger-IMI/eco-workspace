// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import ConsentService from '../services/ConsentService.js';
import VisitsService from '../services/VisitsService.js';
import SitesService from '../services/SitesService.js';
const Constants = commonServices.Constants;
const { getCommunicationServiceInstance } = commonServices.CommunicationService;

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialVisitsController extends WebcController {
  constructor(...props) {
    super(...props);
    let { id, keySSI, uid } = this.history.location.state;
    this.consentService = new ConsentService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);

    this.model = {
      id,
      keySSI,
      uid,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
    await this.getVisits();
  }

  async getConsents() {
    this.consents = await this.consentService.getTrialConsents(this.model.keySSI);
    console.log(JSON.parse(JSON.stringify(this.consents)));
    this.model.consents = this.consents.map((x, idx) => ({ ...x, selected: idx === 0 ? true : false }));
  }

  async getVisits() {
    const visitsData = await this.visitsService.getTrialVisits(this.model.keySSI);
    console.log(visitsData);
    this.model.visits = visitsData.visits;
    this.model.selectedVisits = JSON.parse(JSON.stringify(this.model.visits)).find(
      (x) => x.consentId === this.model.consents.find((x) => x.selected === true).id
    ) || { data: [] };
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => !!(this.model.consents && Array.isArray(this.model.consents) && this.model.consents.length > 0),
      'consents'
    );

    this.onTagClick('select-consent', async (model) => {
      this.model.consents = this.consents.map((x) => ({ ...x, selected: model.id === x.id ? true : false }));
      this.model.selectedVisits = JSON.parse(JSON.stringify(this.model.visits)).find(
        (x) => x.consentId === model.id
      ) || { data: [] };
      console.log(JSON.parse(JSON.stringify(this.model.selectedVisits)));
    });

    this.onTagClick('add-visits', async () => {
      console.log('Adding event');

      this.showModalFromTemplate(
        'add-new-trial-visits',
        (event) => {
          this.getVisits();
          this.sendMessageToAllTrialSites();
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showErrorModal('ERROR: There was an issue creating the new consent', 'Result', () => {});
          }
        },
        {
          controller: 'AddNewTrialVisitsModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          consents: JSON.parse(JSON.stringify(this.model.consents)),
        }
      );
    });
  }

  async sendMessageToAllTrialSites() {
    const sites = await this.sitesService.getSites(this.model.keySSI);
    for (const site of sites) {
      this.sendMessageToHco(Constants.MESSAGES.HCO.UPDATE_BASE_PROCEDURES, site.uid, 'New consent version', site.did);
    }
  }

  sendMessageToHco(operation, ssi, shortMessage, receiverDid) {
    try {
      let communicationService = getCommunicationServiceInstance();
      communicationService.sendMessage(receiverDid, {
        operation: operation,
        ssi: ssi,
        shortDescription: shortMessage,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
