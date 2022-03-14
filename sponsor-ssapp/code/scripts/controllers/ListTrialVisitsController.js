// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const { getDidServiceInstance } = commonServices.DidService;
import ConsentService from '../services/ConsentService.js';
import VisitsService from '../services/VisitsService.js';

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ListTrialVisitsController extends WebcController {
  constructor(...props) {
    super(...props);
    let { id, keySSI, data } = this.history.location.state;

    this.consentService = new ConsentService(this.DSUStorage);
    this.visitsService = new VisitsService(this.DSUStorage);

    this.model = {
      id,
      keySSI,
      data,
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
        () => {
          this.getVisits();
          // this.showFeedbackToast('Result', 'Visits were added successfully', 'toast');
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
          controller: 'AddNewTrialVisitsModalController',
          disableExpanding: false,
          disableBackdropClosing: true,
          consents: JSON.parse(JSON.stringify(this.model.consents)),
        }
      );
    });
  }
}
