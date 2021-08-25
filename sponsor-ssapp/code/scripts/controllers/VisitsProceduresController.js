import CommunicationService from '../services/CommunicationService.js';
import NewConsentService from '../services/NewConsentService.js';
import TrialsService from '../services/TrialsService.js';
import eventBusService from '../services/EventBusService.js';
import { Topics } from '../constants/topics.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class VisitsProceduresController extends WebcController {
  constructor(...props) {
    super(...props);
    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.SPONSOR_IDENTITY);
    this.consentsService = new NewConsentService(this.DSUStorage);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.feedbackEmitter = null;

    this.model = {
      consents: [],
      procedures: [],
      visits: [],
      dataLoaded: false,
      trial: null,
      notEditable: true,
      filters: [],
      filteredVisits: [],
    };

    this.attachEvents();

    this.init();

    eventBusService.addEventListener(Topics.RefreshTrialConsents, async () => {
      await this.getConsents();
      this.model.filters = this.model.consents.map((x) => ({ name: x.name, selected: true }));
    });
  }

  async init() {
    await this.getConsents();
    this.model.trial = await this.trialsService.getTrial(this.keySSI);
    this.model.dataLoaded = true;
  }

  async getConsents() {
    this.model.consents = await this.consentsService.getTrialConsents(this.keySSI);
    this.model.filters = this.model.consents.map((x) => ({ name: x.name, selected: true }));

    const visits = [];
    if (this.model.consents && this.model.consents.length > 0) {
      this.model.consents.forEach((x) => {
        if (x.visits && x.visits.length > 0) {
          x.visits.forEach((y) => visits.push(y));
        }
      });
    }

    await this.loadModel(visits);

    return;
  }

  async loadModel(visits) {
    visits.sort((a, b) => a.id - b.id);

    this.model.visits = visits.map((x) => {
      return {
        id: x.id,
        uuid: x.uuid,
        inputId: 'input_' + x.id,
        selectId: 'select_' + x.id,
        name: {
          label: 'Visit',
          name: 'visit',
          required: true,
          placeholder: 'Visit...',
          value: x.name,
          type: 'text',
        },
        consent: {
          label: 'Select a consent',
          placeholder: 'Please select an option',
          required: false,
          options: this.model.consents.map((y) => ({
            label: y.name,
            value: y.keySSI,
            selected: x.consent.keySSI === y.keySSI ? 'selected' : null,
          })),
        },
        procedures: x.procedures.map((y) => ({
          id: x.id + ':' + y.id,
          uuid: y.uuid,
          checkbox: {
            type: 'checkbox',
            placeholder: 'enabled',
            label: y.id,
            checked: y.checked,
          },
          name: {
            label: 'Procedure',
            name: 'procedure',
            required: true,
            placeholder: 'Procedure...',
            value: y.name,
            type: 'text',
          },
          period: {
            label: 'Period',
            name: 'period',
            required: true,
            placeholder: 'Period...',
            value: y.period,
            type: 'number',
          },
          timeUnit: {
            id: 'unit_' + x.id + '_' + y.id,
            label: 'Select a time unit',
            placeholder: 'Please select an option',
            required: true,
            options: [
              { label: 'Day', value: 'Day', selected: y.unit === 'Day' ? 'selected' : null },
              { label: 'Week', value: 'Week', selected: y.unit === 'Week' ? 'selected' : null },
              { label: 'Month', value: 'Month', selected: y.unit === 'Month' ? 'selected' : null },
            ],
          },
        })),
      };
    });

    if (this.model.visits && this.model.visits.length > 0) {
      const procedures = JSON.parse(JSON.stringify(this.model.visits[0].procedures));
      this.model.procedures = procedures.map((y, idx) => ({
        id: idx,
      }));
    }
    this.filter();
    return;
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  filter() {
    this.model.filteredVisits = this.model.visits.filter((x) =>
      x.consent.options.reduce((acc, y) => {
        return this.model.filters.find((z) => z.name === y.label).selected && y.selected === 'selected' ? true : acc;
      }, false)
    );
  }

  attachEvents() {
    this.model.addExpression(
      'visitsExist',
      () => {
        return this.model.visits && Array.isArray(this.model.visits) && this.model.visits.length > 0;
      },
      'visits'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagEvent('edit', 'click', () => {
      this.model.notEditable = !this.model.notEditable;
    });

    this.onTagEvent('cancel', 'click', async () => {
      await this.getConsents();
      this.model.notEditable = !this.model.notEditable;
    });

    this.onTagClick('filter-visits', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedFilter = this.model.filters.find((x) => x.name === data);
      selectedFilter.selected = !selectedFilter.selected;

      if (this.model.visits && Array.isArray(this.model.visits) && this.model.visits.length > 0) {
        this.filter();
      }
    });

    this.onTagEvent('addVisit', 'click', () => {
      const visits = JSON.parse(JSON.stringify(this.model.visits));

      const newVisits = [
        ...visits,
        {
          id: visits.length,
          uuid: uuidv4(),
          inputId: 'input_' + visits.length,
          selectId: 'select_' + visits.length,
          name: {
            label: 'Visit',
            name: 'visit',
            required: true,
            placeholder: 'Visit...',
            value: '',
            type: 'text',
          },
          consent: {
            label: 'Select a consent',
            placeholder: 'Please select an option',
            required: false,
            options: this.model.consents.map((x) => ({
              label: x.name,
              value: x.keySSI,
            })),
          },
          procedures:
            this.model.procedures.length > 0
              ? this.model.procedures.map((y) => ({
                  id: visits.length + ':' + y.id,
                  uuid: uuidv4(),
                  name: {
                    label: 'Procedure',
                    name: 'procedure',
                    required: true,
                    placeholder: 'Procedure...',
                    value: '',
                    type: 'text',
                  },
                  checkbox: {
                    type: 'checkbox',
                    placeholder: 'enabled',
                    label: y.id,
                    checked: true,
                  },
                  period: {
                    label: 'Period',
                    name: 'period',
                    required: true,
                    placeholder: 'Period...',
                    value: '',
                    type: 'number',
                  },
                  timeUnit: {
                    id: 'unit_' + visits.length + '_' + y.id,
                    label: 'Select a time unit',
                    placeholder: 'Please select an option',
                    required: true,
                    options: [
                      { label: 'Day', value: 'Day' },
                      { label: 'Week', value: 'Week' },
                      { label: 'Month', value: 'Month' },
                    ],
                  },
                }))
              : [],
        },
      ];

      // this.model.setChainValue('visits', newVisits);
      this.model.visits = newVisits;
    });

    this.onTagEvent('removeVisit', 'click', () => {
      if (this.model.visits.length === 0) return;
      // const visits = JSON.parse(JSON.stringify(this.model.visits));
      // this.model.setChainValue('visits', visits.slice(0, -1));

      this.model.visits = this.model.visits.slice(0, -1);
    });

    this.onTagEvent('addProcedure', 'click', () => {
      const procedures = JSON.parse(JSON.stringify(this.model.procedures));
      this.model.setChainValue('procedures', [
        ...procedures,
        {
          id: procedures.length,
        },
      ]);
      // this.model.procedures = [...this.model.procedures, { id: this.model.procedures.length }];
      const newVisits = this.model.visits.map((x) => ({
        ...x,
        procedures: this.model.procedures.map((y) => ({
          id: x.id + ':' + y.id,
          uuid: !!x.procedures[parseInt(y.id)] ? x.procedures[parseInt(y.id)].uuid : uuidv4(),
          name: {
            label: 'Procedure',
            name: 'procedure',
            required: true,
            placeholder: 'Procedure...',
            value: !!x.procedures[parseInt(y.id)] ? x.procedures[parseInt(y.id)].name.value : '',
            type: 'text',
          },
          checkbox: {
            type: 'checkbox',
            placeholder: 'enabled',
            label: y.id,
            checked: true,
          },
          period: {
            label: 'Period',
            name: 'period',
            required: true,
            placeholder: 'Period...',
            value: !!x.procedures[parseInt(y.id)] ? x.procedures[parseInt(y.id)].period.value : '',
            type: 'number',
          },
          timeUnit: {
            id: 'unit_' + x.id + '_' + y.id,
            label: 'Select a time unit',
            placeholder: 'Please select an option',
            required: true,
            options: [
              {
                label: 'Day',
                value: 'Day',
                selected: !!this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id)
                  ? this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id).value === 'Day'
                    ? 'selected'
                    : null
                  : null,
              },
              {
                label: 'Week',
                value: 'Week',
                selected: !!this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id)
                  ? this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id).value === 'Week'
                    ? 'selected'
                    : null
                  : null,
              },
              {
                label: 'Month',
                value: 'Month',
                selected: !!this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id)
                  ? this.element.querySelector('#' + 'unit_' + x.id + '_' + y.id).value === 'Month'
                    ? 'selected'
                    : null
                  : null,
              },
            ],
          },
        })),
      }));
      // this.model.setChainValue('procedures', newProcedures);
      this.model.visits = newVisits;
    });

    this.onTagEvent('removeProcedure', 'click', () => {
      if (this.model.procedures.length === 0) return;
      // const procedures = JSON.parse(JSON.stringify(this.model.procedures));
      // this.model.setChainValue('procedures', procedures.slice(0, -1));
      this.model.procedures = this.model.procedures.slice(0, -1);
      // this.model.procedures.splice(0, -1);
      const newVisits = this.model.visits.map((x) => ({
        ...x,
        procedures: x.procedures.slice(0, -1),
      }));
      // this.model.setChainValue('procedures', newProcedures);
      this.model.visits = newVisits;
    });

    this.onTagEvent('submitData', 'click', async () => {
      let error = null;
      const result = this.model.visits.map((x, idx) => {
        if (x.name.value === '' || !x.procedures || x.procedures.length === 0) {
          // this.showFeedbackToast('Error', 'All procedures must have a name and at least one visit', 'toast');
          error = true;
          // return;
        }
        const targetElement = this.element.querySelector('#' + x.selectId);
        return {
          id: idx,
          uuid: x.uuid,
          name: x.name.value,
          consent: {
            keySSI: targetElement.value,
            id: this.model.consents.find((x) => x.keySSI === targetElement.value).id,
            name: targetElement.options[targetElement.selectedIndex].text,
          },
          procedures: x.procedures.map((y, visitIdx) => {
            const targetElementUnit = this.element.querySelector('#' + y.timeUnit.id);
            if (!y.period.value && y.checkbox.checked) {
              error = true;
            }
            return {
              id: visitIdx,
              uuid: y.uuid,
              name: y.name.value,
              checked: y.checkbox.checked,
              period: y.period.value,
              unit: targetElementUnit.value,
            };
          }),
        };
      });

      if (error) {
        this.showFeedbackToast('Error', 'All procedures must have a name and at least one visit', 'toast');
        return;
      }

      await this.consentsService.updateBaseConsentVisits(result, this.keySSI);
      await this.getConsents();

      this.sendMessageToHco('update-base-procedures', this.keySSI, 'Update trial consents');
      this.model.notEditable = !this.model.notEditable;
      return;
      //TODO: Save to corresponding consents
      // TODO: Update consents if changed
    });
  }

  sendMessageToHco(operation, ssi, shortMessage) {
    this.CommunicationService.sendMessage(CommunicationService.identities.ECO.HCO_IDENTITY, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
