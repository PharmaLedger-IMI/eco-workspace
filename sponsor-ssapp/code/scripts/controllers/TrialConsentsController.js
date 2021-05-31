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
      selectOptions: '',
    },
    slicedPages: null,
    currentPage: 0,
    itemsPerPage: 10,
    totalPages: null,
    itemsPerPageOptions: {
      selectOptions: this.itemsPerPageArray.join(' | '),
      value: this.itemsPerPageArray[1].toString(),
    },
  };

  constructor(...props) {
    super(...props);
    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;
    this.consentsService = new ConsentsService(this.DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);
    this.feedbackEmitter = null;

    this.setModel({
      consents: [],
      pagination: this.pagination,
      headers: this.headers,
      search: this.search,
      type: 'consents',
      tableLength: 7,
      data: [],
    });

    this.attachEvents();

    this.init();
  }

  async init() {
    try {
      await this.getConsents();
      this.setConsentsModel(this.model.consents);
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
      this.setConsentsModel(this.consents);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR: There was an issue accessing consents object', 'Result', 'toast');
    }
  }

  setConsentsModel(consents) {
    const model = [...consents];

    this.model.consents = model;
    this.model.data = model;
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.consents;

    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.name.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
    }

    this.setConsentsModel(result);
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  attachEvents() {
    this.model.addExpression(
      'consentsArrayNotEmpty',
      () => this.model.consents && Array.isArray(this.model.consents) && this.model.consents.length > 0,
      'consents'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagClick('add-consent', async (event) => {
      this.showModalFromTemplate(
        'add-new-consent',
        async (event) => {
          const response = event.detail;
          await this.getConsents();
          this.showFeedbackToast('Result', 'Consent added successfully', 'toast');
          if (this.consents.length === 1) {
            this.sendMessageToHco('add-trial', this.keySSI, 'First consent');
          } else this.sendMessageToHco('add-consent', this.keySSI, 'New trial');
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
          existingIds: this.consents.map((x) => x.id) || [],
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
          this.sendMessageToHco('add-econsent-version', this.keySSI, 'New trial');
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
          isUpdate: this.consents.find((x) => x.id === event.data),
          existingVersions: this.consents.filter((x) => x.id === event.data).map((x) => x.version) || [],
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
  }

  sendMessageToHco(operation, ssi, shortMessage) {
    this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
