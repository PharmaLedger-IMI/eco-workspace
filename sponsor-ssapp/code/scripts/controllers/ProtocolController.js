// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

import getSharedStorage from '../services/SharedDBStorageService.js';

export default class ProtocolController extends WebcController {
  constructor(element, history) {
    super(element, history);

    this.storageService = getSharedStorage(this.DSUStorage);

    this.storageService.waitForDb(() => console.log('WAIT_FOR_DB:', this.storageService.myDb), []);

    console.log('STORAGE_SERVICE:', this.storageService);

    this.setModel({});

    this.attachEvents();

    this.init();
  }

  async init() {
    return;
  }

  attachEvents() {
    return;
  }
}
