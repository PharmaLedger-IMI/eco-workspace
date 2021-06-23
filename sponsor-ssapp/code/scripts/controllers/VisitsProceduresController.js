import CommunicationService from '../services/CommunicationService.js';
import ConsentsService from '../services/ConsentsService.js';
import TrialsService from '../services/TrialsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class VisitsProceduresController extends WebcController {
  constructor(...props) {
    super(...props);
    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.SPONSOR_IDENTITY);
    this.consentsService = new ConsentsService(this.DSUStorage);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.feedbackEmitter = null;

    this.model = {
      consents: [],
      procedures: [],
      visits: [],
      dataLoaded: false,
      trial: null,
    };

    this.attachEvents();

    this.init();
  }

  async init() {
    await this.getConsents();
    this.model.trial = await this.trialsService.getTrial(this.keySSI);
    this.model.dataLoaded = true;
  }

  async getConsents() {
    this.model.consents = await this.consentsService.getTrialConsents(this.keySSI);
  }

  attachEvents() {}

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  attachEvents() {
    this.model.addExpression(
      'proceduresExist',
      () => {
        console.log('changed');
        return this.model.procedures && Array.isArray(this.model.procedures) && this.model.procedures.length > 0;
      },
      'procedures'
    );

    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });

    this.onTagEvent('addProcedure', 'click', () => {
      const procedures = JSON.parse(JSON.stringify(this.model.procedures));
      console.log(this.model.consents);

      const newProcedures = [
        ...procedures,
        {
          id: procedures.length,
          inputId: 'input_' + procedures.length,
          selectId: 'select_' + procedures.length,
          name: {
            label: 'Procedure',
            name: 'procedure',
            required: true,
            placeholder: 'Procedure...',
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
          visits:
            this.model.visits.length > 0
              ? this.model.visits.map((y) => ({
                  id: procedures.length + ':' + y.id,
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
                    id: 'unit_' + procedures.length + '_' + y.id,
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

      // this.model.setChainValue('procedures', newProcedures);
      this.model.procedures = newProcedures;
      console.log(JSON.stringify(newProcedures, null, 2));
    });

    this.onTagEvent('removeProcedure', 'click', () => {
      if (this.model.procedures.length === 0) return;
      // const procedures = JSON.parse(JSON.stringify(this.model.procedures));
      // this.model.setChainValue('procedures', procedures.slice(0, -1));

      this.model.procedures = this.model.procedures.slice(0, -1);
    });

    this.onTagEvent('addVisit', 'click', () => {
      const visits = JSON.parse(JSON.stringify(this.model.visits));
      this.model.setChainValue('visits', [
        ...visits,
        {
          id: visits.length,
        },
      ]);
      // this.model.visits = [...this.model.visits, { id: this.model.visits.length }];
      const newProcedures = this.model.procedures.map((x) => ({
        ...x,
        visits: this.model.visits.map((y) => ({
          id: x.id + ':' + y.id,
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
            id: 'unit_' + x.id + '_' + y.id,
            label: 'Select a time unit',
            placeholder: 'Please select an option',
            required: true,
            options: [
              { label: 'Day', value: 'Day' },
              { label: 'Week', value: 'Week' },
              { label: 'Month', value: 'Month' },
            ],
          },
        })),
      }));
      // this.model.setChainValue('procedures', newProcedures);
      this.model.procedures = newProcedures;
    });

    this.onTagEvent('removeVisit', 'click', () => {
      if (this.model.visits.length === 0) return;
      // const visits = JSON.parse(JSON.stringify(this.model.visits));
      // this.model.setChainValue('visits', visits.slice(0, -1));
      this.model.visits = this.model.visits.slice(0, -1);
      // this.model.visits.splice(0, -1);
      const newProcedures = this.model.procedures.map((x) => ({
        ...x,
        visits: x.visits.slice(0, -1),
      }));
      // this.model.setChainValue('procedures', newProcedures);
      this.model.procedures = newProcedures;
    });

    this.onTagEvent('submitData', 'click', () => {
      console.log('Submitting...');

      let error = null;
      const result = this.model.procedures.map((x, idx) => {
        if (x.name.value === '' || !x.visits || x.visits.length === 0) {
          // this.showFeedbackToast('Error', 'All procedures must have a name and at least one visit', 'toast');
          error = true;
          // return;
        }
        const targetElement = this.element.querySelector('#' + x.selectId);
        return {
          id: idx,
          name: x.name.value,
          consent: {
            keySSI: targetElement.value,
            id: this.model.consents.find((x) => x.keySSI === targetElement.value).id,
            name: targetElement.options[targetElement.selectedIndex].text,
          },
          visits: x.visits.map((y, visitIdx) => {
            const targetElementUnit = this.element.querySelector('#' + y.timeUnit.id);
            if (!y.period.value) {
              error = true;
            }
            return {
              id: visitIdx,
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

      console.log(result);

      //TODO: Save to corresponding consents
      // TODO: Update consents if changed
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
