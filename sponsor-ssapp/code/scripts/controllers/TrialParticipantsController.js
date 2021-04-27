import TrialsService from '../services/TrialsService.js';
import ParticipantsService from '../services/ParticipantsService.js';
import { trialTableHeaders, participantConsentStatusEnum, senderType } from '../constants/participant.js';
import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class TrialParticipantsController extends WebcController {
  typesArray = Object.entries(participantConsentStatusEnum).map(([k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];
  headers = trialTableHeaders;

  search = {
    label: 'Search for consent',
    required: false,
    placeholder: 'Consent name...',
    value: '',
  };

  participants = null;

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

  constructor(element, history) {
    super(element, history);
    let { id, keySSI } = this.history.location.state;

    this.trialsService = new TrialsService(this.DSUStorage);

    this.keySSI = keySSI;
    this.participantsService = new ParticipantsService(this.DSUStorage);

    eventBusService.addEventListener(Topics.RefreshParticipants + keySSI, async (data) => {
      console.log('Refreshing, participant status changed for this trial');

      const list = await this.participantsService.updateParticipant(
        {
          participantId: data.message.useCaseSpecifics.tpNumber,
          operationDate: data.message.useCaseSpecifics.operationDate,
          trialSSI: data.message.useCaseSpecifics.trialSSI,
          consentSSI: data.message.ssi,
          type: data.sender === 'hcoIdentity' ? senderType.HCP : senderType.Patient,
        },
        this.keySSI
      );

      console.log(list);

      this.getParticipants();
    });

    this.feedbackEmitter = null;

    this.setModel({
      participants: [],
      pagination: this.pagination,
      headers: this.headers,
      search: this.search,
    });

    this.attachAll();

    this.init();
  }

  async init() {
    await this.getParticipants();
    this.paginateData(this.model.participants);
  }

  async getParticipants() {
    try {
      this.participants = await this.participantsService.getTrialParticipants(this.keySSI);
      this.setDataModel(this.participants);
    } catch (error) {
      console.log(error);
      this.showFeedbackToast('ERROR: There was an issue accessing consents object', 'Result', 'toast');
    }
  }

  paginateData(data, page = 1) {
    const itemsPerPage = this.model.pagination.itemsPerPage;
    const length = data.length;
    const numberOfPages = Math.ceil(length / itemsPerPage);
    const pages = Array.from({ length: numberOfPages }, (_, i) => i + 1).map((x) => ({
      label: x,
      value: x,
      active: page === x,
    }));

    this.model.pagination.previous = page > 1 && pages.length > 1 ? false : true;
    this.model.pagination.next = page < pages.length && pages.length > 1 ? false : true;
    this.model.pagination.items = data.slice(itemsPerPage * (page - 1), itemsPerPage * page);
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

  setDataModel(data) {
    const model = [...data];

    this.model.participants = model;
    this.paginateData(model, 1);
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
  }

  filterData() {
    let result = this.participants;

    if (this.model.search.value && this.model.search.value !== '') {
      result = result.filter((x) => x.participantId.toUpperCase().search(this.model.search.value.toUpperCase()) !== -1);
    }

    this.setDataModel(result);
  }

  attachAll() {
    this.model.addExpression(
      'arrayNotEmpty',
      () => {
        return (
          this.model.pagination &&
          this.model.pagination.items &&
          Array.isArray(this.model.pagination.items) &&
          this.model.pagination.items.length > 0
        );
      },
      'pagination'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.on('filters-changed', async (event) => {
      this.filterData();
    });

    const searchField = this.element.querySelector('#search-field-participants');
    searchField.addEventListener('keydown', () => {
      setTimeout(() => {
        this.model.clearButtonDisabled = false;
        this.filterData();
      }, 300);
    });

    this.on('navigate-to-page', async (event) => {
      event.preventDefault();
      this.paginateData(this.model.participants, event.data.value ? parseInt(event.data.value) : event.data);
    });

    this.on('go-to-previous-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateData(this.model.participants, this.model.pagination.currentPage - 1);
      }
    });

    this.on('go-to-next-page', async () => {
      if (this.model.pagination.currentPage !== this.model.pagination.totalPages) {
        this.paginateData(this.model.participants, this.model.pagination.currentPage + 1);
      }
    });

    this.on('go-to-last-page', async () => {
      const length = this.model.consents.length;
      const numberOfPages = Math.ceil(length / this.model.pagination.itemsPerPage);
      if (this.model.pagination.currentPage !== numberOfPages) {
        this.paginateData(this.model.participants, numberOfPages);
      }
    });

    this.on('go-to-first-page', async () => {
      if (this.model.pagination.currentPage !== 1) {
        this.paginateData(this.model.participants, 1);
      }
    });

    this.on('set-items-per-page', async (event) => {
      this.model.pagination.itemsPerPage = parseInt(event.data.value);
      this.paginateData(this.model.participants, 1);
    });

    this.on('sort-column', async (event) => {
      this.sortColumn(event.data);
    });
  }
}
