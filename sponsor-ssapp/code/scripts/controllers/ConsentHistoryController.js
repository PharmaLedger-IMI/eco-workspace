// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import { consentTableHeaders } from '../constants/consent.js';

// import eventBusService from '../services/EventBusService.js';
// import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class ConsentHistoryConsentsController extends WebcController {
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
    let { id, keySSI, uid, data } = this.history.location.state;

    this.model = {
      id,
      keySSI,
      uid,
      data,
      pagination: this.pagination,
      headers: this.headers,
      clearButtonDisabled: true,
      type: 'consents',
      tableLength: 7,
    };

    this.attachEvents();

    this.init();
  }

  async init() {}

  attachEvents() {
    this.onTagClick('navigate-to-consents', async () => {
      this.navigateToPageTag('trial-consents', {
        id: this.model.id,
        keySSI: this.model.keySSI,
        uid: this.model.uid,
      });
    });

    this.onTagClick('view-attachment', async (model) => {
      this.navigateToPageTag('preview-consent', {
        id: this.model.id,
        keySSI: this.model.keySSI,
        uid: this.model.uid,
        data: model,
        history: JSON.parse(JSON.stringify(this.model.data)),
      });
    });
  }
}
