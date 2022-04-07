// eslint-disable-next-line no-undef
const commonServices = require('common-services');
import TrialsService from '../services/TrialsService.js';
const DidService = commonServices.DidService;
// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewTrialModalController extends WebcController {
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
    invalid: false,
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
    disabled: true,
    placeholder: 'Please insert the sponsor DID...',
    value: '',
  };

  constructor(...props) {
    super(...props);
    this.existingIds = props[0].existingIds;
    this.trialsService = new TrialsService(this.DSUStorage);
    DidService.getDidServiceInstance()
      .getDID()
      .then((identityString) => {
        this.did.value = identityString;
        this.setModel({
          trial: {
            id: this.id,
            name: this.name,
            sponsor: this.sponsor,
            did: this.did,
          },
          submitButtonDisabled: false,
        });
      });

    this.attachAll();
  }

  attachAll() {
    const trialId = 'trial.id.value';
    const modelsChains = ['trial.name.value', 'trial.sponsor.value', trialId];

    this.model.onChange(trialId, () => {
      this.model.trial.id.invalidValue = this.existingIds.indexOf(this.model.trial.id.value) > -1;
    });

    /**
     * check for empty inputs
     */
    modelsChains.forEach((modelChain) => {
      this.model.onChange(modelChain, () => {
        let formIsValid = true;
        modelsChains.forEach((chain) => {
          if (this.model.getChainValue(chain).trim() === '') {
            formIsValid = false;
          }
        });
        this.model.submitButtonDisabled = !formIsValid || this.model.trial.id.invalidValue;
      });
    });

    this.onTagClick('create-trial', async () => {
      try {
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
