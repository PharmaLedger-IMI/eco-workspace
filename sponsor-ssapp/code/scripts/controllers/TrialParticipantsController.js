import ParticipantsService from '../services/ParticipantsService.js';
import { trialTableHeaders, participantConsentStatusEnum } from '../constants/participant.js';
import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class TrialParticipantsController extends WebcController {
  typesArray = Object.entries(participantConsentStatusEnum).map(([k, v]) => v);
  itemsPerPageArray = [5, 10, 15, 20, 30];
  headers = trialTableHeaders;

  search = {
    label: 'Search for participant id',
    required: false,
    placeholder: 'Participant id...',
    value: '',
  };

  participants = null;

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
    this.participantsService = new ParticipantsService(this.DSUStorage);

    eventBusService.addEventListener(Topics.RefreshParticipants + keySSI, async (data) => {
      this.getParticipants();
    });

    this.setModel({
      participants: [],
      pagination: this.pagination,
      headers: this.headers,
      search: this.search,
      type: 'participants',
      tableLength: 6,
    });

    this.attachAll();

    this.init();
  }

  async init() {
    await this.getParticipants();
  }

  async getParticipants() {
    try {
      this.participants = await this.participantsService.getTrialParticipants(this.keySSI);
      this.setDataModel(this.participants);
    } catch (error) {
      console.log(error);
      this.showErrorModal('ERROR: There was an issue accessing consents object', 'Result', () => {});
    }
  }

  setDataModel(data) {
    const model = [...data];

    this.model.participants = model;
    this.model.headers = this.model.headers.map((x) => ({ ...x, asc: false, desc: false }));
    this.model.data = model;
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
      'participantsArrayNotEmpty',
      () => this.model.participants && Array.isArray(this.model.participants) && this.model.participants.length > 0,
      'participants'
    );

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
  }
}
