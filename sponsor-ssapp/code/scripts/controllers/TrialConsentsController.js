import { consentTypeEnum, consentTableHeaders } from '../constants/consent.js';
import ConsentsService from '../services/ConsentsService.js';
import CommunicationService from '../services/CommunicationService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class TrialConsentsController extends WebcController {
  typesArray = Object.entries(consentTypeEnum).map(([k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];
  headers = consentTableHeaders;

  search = {
    label: 'Search for consent',
    required: false,
    placeholder: 'Consent name...',
    value: '',
  };

  consents = null;

  pagination = {
    previous: false,
    next: false,
    items: null,
    pages: {
      options: [],
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      options: this.itemsPerPageArray.map((x) => ({
        label: x,
        value: x,
      })),
    },
  };

  constructor(...props) {
    super(...props);
    let { id, keySSI } = this.history.location.state;

    console.log('INSIDE CONSTRUCTOR', id, keySSI, this.history.location);

    this.keySSI = keySSI;
    this.consentsService = new ConsentsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);
    this.feedbackEmitter = null;

    this.setModel({
      consents: [],
      pagination: this.pagination,
      headers: this.headers,
      search: this.search,
      testing: {
        templateInput: {
          type: 'text',
          value: 2,
          style: 'border: 1px solid red',
        },
        templateLabel: {
          text: 'Inner template label',
        },
      },
      type: 'consents',
      tableLength: 7,
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    try {
      await this.getConsents();
      this.paginateConsents(this.model.consents);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR: There was an issue accessing trials object', 'Result', 'toast');
    }
  }

  async getConsents() {
    try {
      const consents = await this.consentsService.getTrialConsents(this.keySSI);
      this.consents = [];
      for (const consent of consents) {
        for (const version of consent.versions) {
          this.consents.push({
            id: consent.id,
            keySSI: consent.keySSI,
            name: consent.name,
            type: consent.type,
            attachment: version.attachment,
            version: version.version,
            versionDate: version.versionDate,
            enableUpdateButton: consent.versions.indexOf(version) === consent.versions.length - 1 ? true : false,
          });
        }
      }
      console.log('CONSENTS RECEIVED:', this.consents);
      this.setConsentsModel(this.consents);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR: There was an issue accessing consents object', 'Result', 'toast');
    }
  }

  paginateConsents(consents, page = 1) {
    const itemsPerPage = this.model.pagination.itemsPerPage;
    const length = consents.length;
    const numberOfPages = Math.ceil(length / itemsPerPage);
    const pages = Array.from({ length: numberOfPages }, (_, i) => i + 1).map((x) => ({
      label: x,
      value: x,
      active: page === x,
    }));

    this.model.pagination.previous = page > 1 && pages.length > 1 ? false : true;
    this.model.pagination.next = page < pages.length && pages.length > 1 ? false : true;
    this.model.pagination.items = consents.slice(itemsPerPage * (page - 1), itemsPerPage * page);
    this.model.pagination.pages = {
      ...this.model.pagination.pages,
      options: pages.map((x) => ({
        label: x.label,
        value: x.value,
      })),
    };
    this.model.pagination.slicedPages =
      pages.length > 5 && page - 3 >= 0 && page + 3 <= pages.length
        ? pages.slice(page - 3, page + 2)
        : pages.length > 5 && page - 3 < 0
        ? pages.slice(0, 5)
        : pages.length > 5 && page + 3 > pages.length
        ? pages.slice(pages.length - 5, pages.length)
        : pages;
    this.model.pagination.currentPage = page;
    this.model.pagination.totalPages = pages.length;
  }

  setConsentsModel(consents) {
    const model = [...consents];

    this.model.consents = model;
    this.paginateConsents(model, 1);
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.consents;

    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
    }

    this.setConsentsModel(result);
  }

  sortColumn(column) {
    if (column || this.model.headers.some((x) => x.asc || x.desc)) {
      if (!column) column = this.model.headers.find((x) => x.asc || x.desc).column;

      const headers = this.model.headers;
      const selectedColumn = headers.find((x) => x.column === column);
      const idx = headers.indexOf(selectedColumn);

      if (headers[idx].notSortable) return;

      if (headers[idx].asc || headers[idx].desc) {
        this.model.consents.reverse();
        this.paginateConsents(this.model.consents, this.model.pagination.currentPage);
        this.model.headers = this.model.headers.map((x) => {
          if (x.column !== column) {
            return { ...x, asc: false, desc: false };
          } else return { ...x, asc: !headers[idx].asc, desc: !headers[idx].desc };
        });
      } else {
        this.model.consents = this.model.consents.sort((a, b) => (a[column] >= b[column] ? 1 : -1));
        this.paginateConsents(this.model.consents, this.model.pagination.currentPage);
        this.model.headers = this.model.headers.map((x) => {
          if (x.column !== column) {
            return { ...x, asc: false, desc: false };
          } else return { ...x, asc: true, desc: false };
        });
      }
    } else {
      this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
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
      () => {
        return (
          this.model.pagination &&
          this.model.pagination.items &&
          Array.isArray(this.model.pagination.items) &&
          this.model.pagination.items.length > 0
        );
      },
      'pagination.items'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagClick('test', (e) => {
      console.log('Testing fired');
    });

    this.onTagClick('add-consent', async (event) => {
      console.log('running add consent');
      this.showModalFromTemplate(
        'add-new-consent',
        (event) => {
          const response = event.detail;
          this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          console.log('THIS.KEYSSI:', this.keySSI);
          this.sendMessageToHco('add-trial', this.keySSI, 'New trial');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewConsentModalController',
          disableExpanding: true,
          disableBackdropClosing: false,
          isUpdate: false,
        }
      );
    });

    this.on('update-consent', async (event) => {
      this.showModalFromTemplate(
        'add-new-consent',
        (event) => {
          const response = event.detail;
          this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          this.sendMessageToHco('add-trial', this.keySSI, 'New trial');
        },
        (event) => {
          const error = event.detail || null;
          if (error instanceof Error) {
            console.log(error);
            this.showFeedbackToast('Result', 'ERROR: There was an issue creating the new consent', 'toast');
          }
        },
        {
          controller: 'AddNewConsentModalController',
          disableExpanding: true,
          disableBackdropClosing: false,
          isUpdate: this.consents.find((x) => x.version === event.data),
        }
      );
    });

    this.on('delete-consent', async (event) => {
      try {
        await this.consentsService.deleteConsent(this.keySSI, event.data);
        this.showFeedbackToast('Result', 'Consent deleted successfully', 'toast');
        this.getConsents();
      } catch (error) {
        this.showFeedbackToast('Result', 'ERROR: The was an error, consent cannot be deleted right now', 'toast');
      }
    });
    this.on('set-as-current', async (event) => {});

    this.on('filters-changed', async (event) => {
      this.filterData();
    });

    const searchField = this.element.querySelector('#search-field-consents');
    searchField.addEventListener('keydown', () => {
      setTimeout(() => {
        this.model.clearButtonDisabled = false;
        this.filterData();
      }, 300);
    });

    this.on('navigate-to-page', async (event) => {
      event.preventDefault();
      this.paginateConsents(this.model.consents, event.data.value ? parseInt(event.data.value) : event.data);
    });

    this.on('go-to-previous-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateConsents(this.model.consents, this.model.pagination.currentPage - 1);
      }
    });

    this.on('go-to-next-page', async () => {
      if (this.model.pagination.currentPage !== this.model.pagination.totalPages) {
        this.paginateConsents(this.model.consents, this.model.pagination.currentPage + 1);
      }
    });

    this.on('go-to-last-page', async () => {
      const length = this.model.consents.length;
      const numberOfPages = Math.ceil(length / this.model.pagination.itemsPerPage);
      if (this.model.pagination.currentPage !== numberOfPages) {
        this.paginateConsents(this.model.consents, numberOfPages);
      }
    });

    this.on('go-to-first-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateConsents(this.model.consents, 1);
      }
    });

    this.on('set-items-per-page', async (event) => {
      this.model.pagination.itemsPerPage = parseInt(event.data.value);
      this.paginateConsents(this.model.consents, 1);
    });

    this.on('sort-column', async (event) => {
      this.sortColumn(event.data);
    });
  }

  sendMessageToHco(operation, ssi, shortMessage) {
    this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
