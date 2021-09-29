const ecoServices = require('eco-services');
const CommunicationService = ecoServices.CommunicationService;
const  Constats = ecoServices.Constants;
import ConsentService from '../services/ConsentService.js';
import TrialsService from '../services/TrialsService.js';
import eventBusService from '../services/EventBusService.js';
import SitesService from '../services/SitesService.js';
import { Topics } from '../constants/topics.js';
import { countryListAlpha2 } from '../constants/countries.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class VisitsProceduresController extends WebcController {
  constructor(...props) {
    super(...props);
    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.SPONSOR_IDENTITY);
    this.consentsService = new ConsentService(this.DSUStorage);
    this.trialsService = new TrialsService(this.DSUStorage);
    this.sitesService = new SitesService(this.DSUStorage);
    this.feedbackEmitter = null;

    this.model = {
      consents: [],
      procedures: [],
      visits: [],
      dataLoaded: false,
      trial: null,
      notEditable: true,
      filters: [],
      filteredProcedures: [],
      selectedCountryIdx: 0,
      selectedSiteIdx: 0,
    };

    this.attachEvents();

    this.init();

    eventBusService.addEventListener(Topics.RefreshTrialConsents, async () => {
      await this.getSites();
      await this.getConsents();
      this.model.filters = this.model.consents.map((x) => ({ name: x.name, selected: true }));
    });
  }

  async init() {
    await this.getSites();
    await this.getConsents();
    this.model.trial = await this.trialsService.getTrial(this.keySSI);
    this.model.dataLoaded = true;
  }

  async getSites() {
    const sites = await this.sitesService.getSites(this.keySSI);
    if (sites && sites.length > 0) {
      const countries = sites
        .map((x) => x.country)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => {
          return a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0;
        });

      const result = countries.map((x) => {
        return {
          country: countryListAlpha2[x],
          sites:
            sites && sites.length > 0
              ? sites
                  .filter((y) => y.country === x)
                  .sort((a, b) =>
                    a.id.toUpperCase() < b.id.toUpperCase() ? -1 : a.id.toUpperCase() > b.id.toUpperCase() ? 1 : 0
                  )
              : false,
        };
      });

      result.sort((a, b) => {
        return a.country.toUpperCase() < b.country.toUpperCase()
          ? -1
          : a.country.toUpperCase() > b.country.toUpperCase()
          ? 1
          : 0;
      });
      this.model.countries = result;

      this.model.country = {
        label: 'Select a country',
        placeholder: 'Please select an option',
        required: false,
        options: this.model.countries.map((x, idx) => ({
          label: x.country,
          value: idx,
        })),
      };

      this.model.site = {
        label: 'Select a site',
        placeholder: 'Please select an option',
        required: false,
        options: this.model.countries[0].sites.map((x, idx) => ({
          label: x.name,
          value: idx,
        })),
      };

      console.log(JSON.parse(JSON.stringify(this.model.countries)));
      this.getConsents();
      return;
    } else {
      this.model.countries = [];
      this.model.country = {
        label: 'Select a country',
        placeholder: 'Please select an option',
        required: false,
        options: [],
      };

      this.model.site = {
        label: 'Select a site',
        placeholder: 'Please select an option',
        required: false,
        options: [],
      };
      return;
    }
  }

  async getConsents() {
    if (
      this.model.countries &&
      this.model.countries.length > 0 &&
      this.model.countries[this.model.selectedCountryIdx].sites &&
      this.model.countries[this.model.selectedCountryIdx].sites.length > 0
    ) {
      const consents = this.model.countries[this.model.selectedCountryIdx].sites[this.model.selectedSiteIdx].consents;
      this.model.consents = JSON.parse(JSON.stringify(consents));
      this.model.filters = this.model.consents.map((x) => ({ name: x.name, selected: true }));

      if (consents.length > 0 && consents[0].visits && consents[0].visits.length > 0) {
        await this.loadModel(consents);
      }
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

    console.log(visits);

    const randomizationIdx = visits.findIndex((x) => x.isRandomizationVisit === true);
    const resultVisits = visits.map((x, idx) => {
      return {
        id: x.id,
        uuid: x.uuid,
        checkbox: {
          type: 'checkbox',
          placeholder: 'enabled',
          label: '',
          checked: x.isRandomizationVisit,
          disabled: !(randomizationIdx > -1 && x.isRandomizationVisit),
        },
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
            disabled: randomizationIdx > -1 ? randomizationIdx === idx : false,
          },
        })),
        visitWindow: x.visitWindow.map((y) => ({
          show: randomizationIdx > -1 ? randomizationIdx <= idx : true,
          window: {
            label: '',
            name: randomizationIdx > -1 ? (randomizationIdx <= idx ? y.type : null) : y.type,
            required: true,
            placeholder: 'from',
            value: randomizationIdx > -1 ? (randomizationIdx <= idx ? y.value : null) : y.value,
            type: randomizationIdx > -1 ? (randomizationIdx <= idx ? 'number' : 'hidden') : 'number',
            disabled: randomizationIdx > -1 ? randomizationIdx === idx : false,
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

    this.onTagEvent('randomizationOnChange', 'click', (model, target, event) => {
      if (this.model.visits && this.model.visits.length > 0) {
        let visits = JSON.parse(JSON.stringify(this.model.visits));
        const isSelected = visits.map((x) => x.checkbox && x.checkbox.checked).every((x) => x === false);
        const idxSelected = visits.findIndex((x) => x.id === model.id);
        if (isSelected) {
          visits = visits.map((x, idx) => ({
            ...x,
            checkbox: {
              ...x.checkbox,
              checked: idx === idxSelected,
              disabled: idx === idxSelected ? false : true,
            },
            weeks:
              idx < idxSelected
                ? [
                    ...x.weeks,
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
                  ]
                : idx === idxSelected
                ? [{ ...x.weeks[0], week: { ...x.weeks[0].week, value: 0, disabled: true } }]
                : x.weeks,
            visitWindow:
              idx < idxSelected
                ? x.visitWindow.map((y) => ({ ...y, window: { ...y.window, type: 'hidden' } }))
                : idx === idxSelected
                ? [{ show: true, window: { ...x.visitWindow[0].window, value: 0, disabled: true } }]
                : x.visitWindow,
          }));
          this.model.visits = visits;
        } else {
          visits = visits.map((x, idx) => ({
            ...x,
            checkbox: {
              ...x.checkbox,
              checked: false,
              disabled: false,
            },
            weeks:
              idx < idxSelected
                ? [{ ...x.weeks[0] }]
                : idx === idxSelected
                ? [{ ...x.weeks[0], week: { ...x.weeks[0].week, value: '', disabled: false } }]
                : x.weeks,
            visitWindow:
              idx < idxSelected
                ? x.visitWindow.map((y) => ({ ...y, window: { ...y.window, type: 'number' } }))
                : idx === idxSelected
                ? [
                    { ...x.visitWindow[0], window: { ...x.visitWindow[0].window, value: '', disabled: false } },
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
                  ]
                : x.visitWindow,
          }));
          this.model.visits = visits;
        }
      }
    });

    this.onTagEvent('edit', 'click', () => {
      this.model.notEditable = !this.model.notEditable;
    });

    this.onTagClick('country-selected', async (model, target, event) => {
      if (this.model.country.option.length > 0) {
        this.model.selectedCountryIdx = target.options.selectedIndex;
        this.model.selectedSiteIdx = 0;

        this.model.site = {
          label: 'Select a site',
          placeholder: 'Please select an option',
          required: false,
          options: this.model.countries[this.model.selectedCountryIdx].sites.map((x, idx) => ({
            label: x.name,
            value: idx,
          })),
        };

        this.model.notEditable = true;
        this.getConsents();
      }
    });

    this.onTagClick('site-selected', async (model, target, event) => {
      if (this.model.site.options.length > 0) {
        this.model.selectedSiteIdx = target.options.selectedIndex;
        this.model.notEditable = true;
        this.getConsents();
      }
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

      const randomizationVisit = visits.find((x) => x.checkbox && x.checkbox.checked === true);

      const newVisits = [
        ...visits,
        {
          id: visits.length,
          uuid: uuidv4(),
          checkbox: {
            type: 'checkbox',
            placeholder: 'enabled',
            label: '',
            checked: false,
            disabled: !!randomizationVisit,
          },
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
      if (this.model.visits.length <= 0) return;
      let visits = JSON.parse(JSON.stringify(this.model.visits));
      const isRandomizationVisit = visits[visits.length - 1].checkbox.checked;
      if (isRandomizationVisit) {
        visits = visits.slice(0, -1);
        visits = visits.map((x, idx) => ({
          ...x,
          checkbox: {
            ...x.checkbox,
            disabled: false,
          },
          weeks: [{ ...x.weeks[0] }],
          visitWindow: x.visitWindow.map((y) => ({ ...y, window: { ...y.window, type: 'number' } })),
        }));
        this.model.visits = visits;
      } else {
        this.model.visits = this.model.visits.slice(0, -1);
      }

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
      const randomizationIdx = this.model.visits.findIndex((x) => x.checkbox.checked === true);
      if (randomizationIdx < 0) {
        this.showFeedbackToast('Error', 'Please make sure you define the randomization visit', 'toast');
        return;
      }
      const result = this.model.visits.map((x, idx) => {
        if (x.name.value === '') error = true;
        if (idx >= randomizationIdx && !x.visitWindow.every((y) => y.window.value !== '')) error = true;
        if (!x.weeks.every((y) => y.week.value !== '')) error = true;

        return {
          id: x.id,
          isRandomizationVisit: x.checkbox.checked,
          uuid: x.uuid,
          name: x.name.value,
          weeks: x.weeks.map((y) => ({ type: y.week.name, value: y.week.value })),
          visitWindow: x.visitWindow.map((y) => {
            if (y.window.type === 'number') return { type: y.window.name, value: y.window.value };
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

      await this.consentsService.updateBaseConsentVisits(
        result,
        this.keySSI,
        this.model.countries[this.model.selectedCountryIdx].sites[this.model.selectedSiteIdx].keySSI
      );
      await this.getSites();
      await this.getConsents();
      this.sendMessageToHco(
        Constants.MESSAGES.HCO.UPDATE_BASE_PROCEDURES,
        this.keySSI,
        'Update trial consents',
        this.model.countries[this.model.selectedCountryIdx].sites[this.model.selectedSiteIdx].did
      );
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
