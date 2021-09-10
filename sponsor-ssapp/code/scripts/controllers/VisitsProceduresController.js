const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
import NewConsentService from '../services/NewConsentService.js';
import TrialsService from '../services/TrialsService.js';
import eventBusService from '../services/EventBusService.js';
import SitesService from '../services/SitesService.js';
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
    this.sitesService = new SitesService(this.DSUStorage);
    this.feedbackEmitter = null;

    this.model = {
      consents: [],
      procedures: [],
      visits: [
        {
          id: 0,
          uuid: uuidv4(),
          name: {
            label: 'Visit',
            name: 'visit',
            required: true,
            placeholder: 'Visit...',
            value: '',
            type: 'text',
          },
          weeks: [
            {
              week: {
                label: '',
                name: 'weekFrom',
                required: true,
                placeholder: 'from',
                value: '',
                type: 'number',
              },
            },
            {
              week: {
                label: '',
                name: 'weekTo',
                required: true,
                placeholder: 'to',
                value: '',
                type: 'number',
              },
            },
          ],
          visitWindow: [
            {
              show: true,
              window: {
                label: '',
                name: 'windowFrom',
                required: true,
                placeholder: 'From',
                value: '',
                type: 'hidden',
              },
            },
          ],
        },
        {
          id: 1,
          uuid: uuidv4(),
          name: {
            label: 'Visit',
            name: 'visit',
            required: true,
            placeholder: 'Visit...',
            value: '',
            type: 'text',
          },
          weeks: [
            {
              week: {
                label: '',
                name: 'weekFrom',
                required: true,
                placeholder: 'from',
                value: '',
                type: 'number',
              },
            },
            {
              week: {
                label: '',
                name: 'weekTo',
                required: true,
                placeholder: 'to',
                value: '',
                type: 'number',
              },
            },
          ],
          visitWindow: [
            {
              show: true,
              window: {
                label: '',
                name: 'windowFrom',
                required: true,
                placeholder: 'From',
                value: '',
                type: 'hidden',
              },
            },
          ],
        },
      ],
      dataLoaded: false,
      trial: null,
      notEditable: true,
      filters: [],
      filteredProcedures: [],
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
    const consents = await this.consentsService.getTrialConsents(this.keySSI);
    this.model.consents = JSON.parse(JSON.stringify(consents));
    this.model.filters = this.model.consents.map((x) => ({ name: x.name, selected: true }));

    if (consents.length > 0 && consents[0].visits && consents[0].visits.length > 0) {
      await this.loadModel(consents);
    }

    return;
  }

  async loadModel(consents) {
    const visits = consents[0].visits;
    let procedures = [];
    consents.forEach((x) => {
      if (x.visits && x.visits.length > 0) {
        x.visits.forEach((y) => {
          if (y.procedures && y.procedures.length > 0) {
            procedures.push(y.procedures);
          }
        });
      }
    });
    procedures = _.flatten(procedures);

    visits.sort((a, b) => a.id - b.id);

    const resultVisits = visits.map((x) => {
      return {
        id: x.id,
        uuid: x.uuid,
        name: {
          label: 'Visit',
          name: 'visit',
          required: true,
          placeholder: 'Visit...',
          value: x.name,
          type: 'text',
        },
        weeks: x.weeks.map((y) => ({
          week: {
            label: '',
            name: y.type,
            required: true,
            placeholder: 'from',
            value: y.value,
            type: 'number',
          },
        })),
        visitWindow: x.visitWindow.map((y) => ({
          show: !!y,
          window: {
            label: '',
            name: y ? y.type : null,
            required: true,
            placeholder: 'from',
            value: y ? y.value : null,
            type: y ? 'number' : 'hidden',
          },
        })),
      };
    });

    const resultProcedures = [];
    for (const procedure of procedures) {
      let exists = resultProcedures.find((x) => (x ? x.uuid === procedure.uuid : false));
      if (exists) {
        const visit = resultVisits.find((x) => x.uuid === procedure.visitUuid);
        exists.visits[visit.id] = {
          visitUuid: procedure.visitUuid,
          checkbox: {
            type: 'checkbox',
            placeholder: 'enabled',
            label: '',
            checked: procedure.checked,
          },
        };
      } else {
        const visit = resultVisits.find((x) => x.uuid === procedure.visitUuid);
        const tempVisits = new Array(resultVisits.length);
        tempVisits[visit.id] = {
          visitUuid: procedure.visitUuid,
          checkbox: {
            type: 'checkbox',
            placeholder: 'enabled',
            label: '',
            checked: procedure.checked,
          },
        };
        resultProcedures[procedure.id] = {
          id: procedure.id,
          uuid: procedure.uuid,
          name: {
            label: 'Procedure',
            name: 'procedure',
            required: true,
            placeholder: 'Procedure...',
            value: procedure.name,
            type: 'text',
          },
          visits: tempVisits,
          selectId: 'select_' + procedure.id,
          consent: {
            label: 'Select a consent',
            placeholder: 'Please select an option',
            required: false,
            options: this.model.consents.map((x) => ({
              label: x.name,
              value: x.keySSI,
              selected: procedure.consent.keySSI === x.keySSI ? 'selected' : null,
            })),
          },
        };
      }
    }

    this.model.visits = resultVisits;
    this.model.procedures = resultProcedures;
    this.filter();

    return;
  }

  showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }

  filter() {
    this.model.filteredProcedures = this.model.procedures.filter((x) =>
      x.consent.options.reduce((acc, y) => {
        return this.model.filters.find((z) => z.name === y.label).selected && y.selected === 'selected' ? true : acc;
      }, false)
    );
    console.log(JSON.parse(JSON.stringify(this.model.filteredProcedures)));
  }

  attachEvents() {
    this.model.addExpression(
      'visitsExist',
      () => {
        return (
          this.model.consents &&
          Array.isArray(this.model.consents) &&
          this.model.consents[0] &&
          this.model.consents[0].visits
        );
      },
      'consents'
    );

    this.model.addExpression(
      'noConsents',
      () => {
        console.log('NO consents:', this.model.consents);
        return !(this.model.consents && Array.isArray(this.model.consents) && this.model.consents.length > 0);
      },
      'consents'
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

    this.onTagClick('filter-procedures', async (model, target, event) => {
      const data = target.getAttribute('data-custom');
      const selectedFilter = this.model.filters.find((x) => x.name === data);
      selectedFilter.selected = !selectedFilter.selected;
      if (this.model.procedures && Array.isArray(this.model.procedures) && this.model.procedures.length > 0) {
        this.filter();
      }
    });

    this.onTagEvent('addVisit', 'click', () => {
      const visits = JSON.parse(JSON.stringify(this.model.visits));
      const procedures = JSON.parse(JSON.stringify(this.model.procedures));

      const newVisits = [
        ...visits,
        {
          id: visits.length,
          uuid: uuidv4(),
          name: {
            label: 'Visit',
            name: 'visit',
            required: true,
            placeholder: 'Visit...',
            value: '',
            type: 'text',
          },
          weeks: [
            {
              week: {
                label: '',
                name: 'week',
                required: true,
                placeholder: 'week',
                value: '',
                type: 'number',
              },
            },
          ],
          visitWindow: [
            {
              show: true,
              window: {
                label: '',
                name: 'windowFrom',
                required: true,
                placeholder: 'From',
                value: '',
                type: 'number',
              },
            },
            {
              show: true,
              window: {
                label: '',
                name: 'windowTo',
                required: true,
                placeholder: 'To',
                value: '',
                type: 'number',
              },
            },
          ],
        },
      ];

      const newProcedures = procedures.map((x) => ({
        ...x,
        visits: newVisits.map((y, idx) => {
          if (x.visits[idx]) {
            return x.visits[idx];
          } else
            return {
              visitUuid: y.uuid,
              checkbox: {
                type: 'checkbox',
                placeholder: 'enabled',
                label: x.name.value,
                checked: true,
              },
            };
        }),
      }));

      this.model.visits = newVisits;
      this.model.procedures = newProcedures;
    });

    this.onTagEvent('removeVisit', 'click', () => {
      if (this.model.visits.length <= 2) return;
      const visits = JSON.parse(JSON.stringify(this.model.visits));
      this.model.visits = this.model.visits.slice(0, -1);
      this.model.procedures = this.model.procedures.map((x) => ({ ...x, visits: x.visits.slice(0, -1) }));
    });

    this.onTagEvent('addProcedure', 'click', () => {
      const procedures = JSON.parse(JSON.stringify(this.model.procedures));
      const visits = JSON.parse(JSON.stringify(this.model.visits));
      const newProcedures = [
        ...procedures,
        {
          id: procedures.length,
          uuid: uuidv4(),
          name: {
            label: 'Procedure',
            name: 'procedure',
            required: true,
            placeholder: 'Procedure...',
            value: '',
            type: 'text',
          },
          visits: visits.map((x) => ({
            visitUuid: x.uuid,
            checkbox: {
              type: 'checkbox',
              placeholder: 'enabled',
              label: x.name.value,
              checked: true,
            },
          })),
          selectId: 'select_' + procedures.length,
          consent: {
            label: 'Select a consent',
            placeholder: 'Please select an option',
            required: false,
            options: this.model.consents.map((x) => ({
              label: x.name,
              value: x.keySSI,
            })),
          },
        },
      ];
      this.model.procedures = newProcedures;
    });

    this.onTagEvent('removeProcedure', 'click', () => {
      if (this.model.procedures.length === 0) return;
      this.model.procedures = this.model.procedures.slice(0, -1);
    });

    this.onTagEvent('submitData', 'click', async () => {
      let error = null;
      const result = this.model.visits.map((x, idx) => {
        if (x.name.value === '') error = true;
        if (idx > 1 && !x.visitWindow.every((y) => y.window.value !== '')) error = true;
        if (idx > 1 && !x.weeks.every((y) => y.week.value !== '')) error = true;

        return {
          id: x.id,
          uuid: x.uuid,
          name: x.name.value,
          weeks: x.weeks.map((y) => ({ type: y.week.name, value: y.week.value })),
          visitWindow: x.visitWindow.map((y) => {
            if (y.show) return { type: y.window.name, value: y.window.value };
            else return null;
          }),
          procedures: this.model.procedures.map((y) => {
            const targetElement = this.element.querySelector('#' + y.selectId);
            if (y.name.value === '') error = true;
            return {
              consent: {
                keySSI: targetElement.value,
                id: this.model.consents.find((z) => z.keySSI === targetElement.value).id,
                name: targetElement.options[targetElement.selectedIndex].text,
              },
              name: y.name.value,
              checked: y.visits[idx].checkbox.checked,
              visitUuid: x.uuid,
              uuid: y.uuid,
              id: y.id,
            };
          }),
        };
      });

      if (error) {
        this.showFeedbackToast('Error', 'Please make sure all fields are filled-in', 'toast');
        return;
      }

      await this.consentsService.updateBaseConsentVisits(result, this.keySSI);
      await this.getConsents();
      const sites = await this.sitesService.getSites(this.keySSI);
      sites.forEach(site => {
        this.sendMessageToHco('update-base-procedures', this.keySSI, 'Update trial consents', site.did);
      });
      this.model.notEditable = !this.model.notEditable;
      return;
      //TODO: Save to corresponding consents
      // TODO: Update consents if changed
    });
  }

  sendMessageToHco(operation, ssi, shortMessage, did) {
    this.CommunicationService.sendMessage(did, {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    });
  }
}
