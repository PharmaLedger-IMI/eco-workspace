// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { trialStatusesEnum } from '../constants/trial.js';
// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialStatusModalController extends WebcController {
  statusesArray = Object.entries(trialStatusesEnum).map(([_k, v]) => v);

  status = {
    label: 'Select status',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.statusesArray,
    disabled: false,
  };

  constructor(...props) {
    super(...props);
    // this.existingIds = props[0].existingIds;
    this.trialsService = new TrialsService(this.DSUStorage);

    this.model.status = this.status;

    this.attachAll();
  }

  attachAll() {
    this.onTagClick('submit', async () => {
      try {
        // this.model.submitButtonDisabled = true;
        // const trial = {
        //   name: this.model.trial.name.value,
        //   id: this.model.trial.id.value,
        //   sponsor: this.model.trial.sponsor.value,
        //   did: this.model.trial.did.value,
        //   consents: [],
        // };
        // const result = await this.trialsService.createTrial(trial);
        // this.model.submitButtonDisabled = false;
        this.send('confirmed', result);
      } catch (error) {
        this.send('closed', new Error('There was an issue updating the status/stage'));
        console.log(error);
      }
    });
  }
}
