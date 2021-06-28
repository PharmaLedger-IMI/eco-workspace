// import { countryListAlpha2 } from '../constants/countries.js';
import TrialsService from '../services/TrialsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialModalController extends WebcController {
  // trialStatusesArray = Object.entries(trialStatusesEnum)
  //   .map(([k, v]) => `${v}, ${v}`)
  //   .join(' | ');

  // trialCountriesArray = Object.entries(countryListAlpha2)
  //   .map(([k, v]) => `${v}, ${k}`)
  //   .join(' | ');

  // countries = {
  //   label: 'List of countries',
  //   placeholder: 'Please select an option',
  //   required: true,
  //   selectOptions: this.trialCountriesArray,
  //   selectionType: 'multiple',
  // };

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

  sponsor = {
    label: 'Sponsor',
    name: 'sponsor',
    required: true,
    placeholder: 'Please insert the sponsor...',
    value: '',
  };

  did = {
    label: 'Sponsor DID',
    name: 'did',
    required: true,
    placeholder: 'Please insert the sponsor DID...',
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
        // countries: this.countries,
        sponsor: this.sponsor,
        did: this.did,
      },
      submitButtonDisabled: true,
    });

    this.attachAll();
  }

  attachAll() {
    const idField = this.element.querySelector('#id-field');
    idField.addEventListener('keydown', () => {
      setTimeout(() => {
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
          id: this.model.trial.id.value,
          sponsor: this.model.trial.sponsor.value,
          did: this.model.trial.did.value,
          consents: [],
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
