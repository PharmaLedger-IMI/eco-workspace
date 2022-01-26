// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
export default class TrialMonitoringController extends WebcController {
  constructor(...props) {
    super(...props);

    this.storageService = SharedStorage.getSharedStorage(this.DSUStorage);

    let { id, keySSI } = this.history.location.state;
    console.log(id, keySSI);
    this.setModel({});

    this.attachEvents();

    this.init();
  }

  async init() {
    this.model.selectedState = { countries: true, sites: false, participants: false };
    return;
  }

  attachEvents() {
    return;
  }
}
