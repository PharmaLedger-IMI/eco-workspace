// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
import { trialStatusesEnum } from '../constants/trial.js';
// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialStatusModalController extends WebcController {
  statusesArray = Object.entries(trialStatusesEnum).map(([_k, v]) => ({ value: v, label: v }));

  status = {
    label: 'Select status',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.statusesArray,
    disabled: false,
  };

  trial = null;

  constructor(...props) {
    super(...props);
    this.trial = props[0].trial;
    this.trialsService = new TrialsService(this.DSUStorage);

    this.model.status = { ...this.status, value: this.trial.status };

    this.attachAll();
  }

  attachAll() {
    this.onTagClick('submit', async () => {
      try {
        const result = await this.trialsService.changeTrialStatus(this.model.status.value, this.trial);
        this.send('confirmed', result);
      } catch (error) {
        this.send('closed', new Error('There was an issue updating the status/stage'));
        console.log(error);
      }
    });
  }
}
