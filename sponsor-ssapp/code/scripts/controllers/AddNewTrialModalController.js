import { trialStatusesEnum } from '../constants/trial.js';
import { countryListAlpha2 } from '../constants/countries.js';
import TrialsService from '../services/TrialsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialModalController extends WebcController {
  trialStatusesArray = Object.entries(trialStatusesEnum).map(([k, v]) => ({
    label: v,
    value: v,
  }));

  trialCountriesArray = Object.entries(countryListAlpha2).map(([k, v]) => ({
    label: v,
    value: k,
  }));

  status = {
    label: 'Select status',
    placeholder: 'Please select an option',
    required: true,
    options: this.trialStatusesArray,
  };

  countries = {
    label: 'Select countries',
    placeholder: 'Please select an option',
    required: true,
    options: this.trialCountriesArray,
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

  constructor(element, history) {
    super(element, history);

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
    // this.model.addExpression(
    //   'disabled',
    //   function () {
    //     console.log('testiung');
    //     return !(
    //       this.model.trial.name.value &&
    //       this.model.trial.status.value &&
    //       this.model.trial.id.value &&
    //       this.model.trial.countries.value
    //     );
    //   },
    //   'trial.status.value'
    // );

    // this.onTagEvent('inputs-changed', 'keypress', async (model, target, event) => {
    //   event.preventDefault();
    //   console.log(model, target, event);
    //   this.model.submitButtonDisabled = !(
    //     this.model.trial.name.value &&
    //     this.model.trial.status.value &&
    //     this.model.trial.id.value &&
    //     this.model.trial.countries.value
    //   );
    //   return;
    // });

    this.onTagClick('create-trial', async (event) => {
      try {
        this.model.submitButtonDisabled = true;
        const trial = {
          name: this.model.trial.name.value,
          status: this.model.trial.status.value,
          id: this.model.trial.id.value,
          countries: Object.entries(countryListAlpha2)
            .map(([k, v]) => k)
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 5 + 1)),
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
