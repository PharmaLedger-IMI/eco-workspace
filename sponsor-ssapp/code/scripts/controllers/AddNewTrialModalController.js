import { trialStatusesEnum } from '../constants/trial.js';
import { countryListAlpha2 } from '../constants/countries.js';
import TrialsService from '../services/TrialsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialModalController extends WebcController {
  trialStatusesArray = Object.entries(trialStatusesEnum)
    .map(([k, v]) => `${v}, ${v}`)
    .join(' | ');

  trialCountriesArray = Object.entries(countryListAlpha2)
    .map(([k, v]) => `${v}, ${k}`)
    .join(' | ');

  status = {
    label: 'Select status',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.trialStatusesArray,
  };

  countries = {
    label: 'List of countries',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.trialCountriesArray,
    selectionType: 'multiple',
  };

  name = {
    label: 'Name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
    value: '',
  };

  id = {
    label: 'Trial Number/ID',
    name: 'id',
    required: true,
    placeholder: 'Please insert an Id...',
    value: '',
  };

  constructor(...props) {
    super(...props);

    this.existingIds = props[0].existingIds;

    this.trialsService = new TrialsService(this.DSUStorage);

    this.setModel({
      trial: {
        id: this.id,
        name: this.name,
        status: this.status,
        countries: this.countries,
      },
      submitButtonDisabled: true,
    });

    this.attachAll();
  }

  attachAll() {
    const idField = this.element.querySelector('#id-field');
    idField.addEventListener('keydown', () => {
      setTimeout(() => {
        console.log(this.existingIds);
        if (this.existingIds.indexOf(this.model.trial.id.value) > -1) {
          this.model.trial.id = {
            ...this.model.trial.id,
            invalidValue: true,
          };
          return;
        }
        this.model.trial.id = {
          ...this.model.trial.id,
          invalidValue: null,
        };
      }, 300);
    });

    this.onTagClick('create-trial', async (event) => {
      try {
        let valid = true;
        for (const x in this.model.trial) {
          if (!this.model.trial[x].value || this.model.trial[x].value === '') {
            this.model.trial[x] = {
              ...this.model.trial[x],
              invalidValue: true,
            };
            setTimeout(() => {
              this.model.trial[x] = {
                ...this.model.trial[x],
                invalidValue: null,
              };
            }, 1000);
            valid = false;
          }
        }

        if (this.existingIds.indexOf(this.model.trial.id.value) > -1) {
          valid = false;
        }

        if (!valid) return;

        this.model.submitButtonDisabled = true;
        const trial = {
          name: this.model.trial.name.value,
          status: this.model.trial.status.value,
          id: this.model.trial.id.value,
          countries: [this.model.trial.countries.value],
          consents: [],
          participants: [],
        };
        const result = await this.trialsService.createTrial(trial);
        this.model.submitButtonDisabled = false;
        this.send('confirmed', result);
      } catch (error) {
        this.send('closed', new Error('There was an issue creating the trial'));
        console.log(error);
      }
    });
  }
}
