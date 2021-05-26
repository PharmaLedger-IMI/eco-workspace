import { consentTypeEnum } from '../constants/consent.js';
import ConsentsService from '../services/ConsentsService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewConsentModalController extends WebcController {
  typesArray = Object.entries(consentTypeEnum).map(([k, v]) => ({
    label: v,
    value: v,
  }));

  type = {
    label: 'Select type',
    placeholder: 'Please select an option',
    required: true,
    options: this.typesArray,
  };

  name = {
    label: 'Name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
    value: '',
  };

  version = {
    label: 'Version',
    name: 'version',
    required: true,
    placeholder: 'Please insert version number...',
    value: '',
  };

  attachment = {
    label: 'Select files',

    listFiles: true,
    filesAppend: false,
    files: [],
  };

  id = {
    label: 'Consent Number/ID',
    name: 'id',
    required: true,
    placeholder: 'Please insert an Id...',
    value: '',
  };

  file = null;
  isUpdate = false;

  constructor(...props) {
    super(...props);

    this.isUpdate = props[0].isUpdate;

    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;

    this.consentsService = new ConsentsService(this.DSUStorage);

    if (this.isUpdate) {
      this.setModel({
        consent: {
          id: { ...this.id, value: this.isUpdate.id, disabled: true },
          name: { ...this.name, value: this.isUpdate.name, disabled: true },
          type: { ...this.type, value: this.isUpdate.type, disabled: true },
          version: this.version,
          attachment: this.attachment,
        },
        submitButtonDisabled: true,
      });
    } else {
      this.setModel({
        consent: {
          id: this.id,
          name: this.name,
          type: this.type,
          version: this.version,
          attachment: this.attachment,
        },
        submitButtonDisabled: true,
      });
    }

    this.attachAll();
  }

  attachAll() {
    this.on('inputs-changed', (event) => {
      this.model.submitButtonDisabled = !(
        this.model.consent.name.value &&
        this.model.consent.type.value &&
        this.model.consent.id.value &&
        this.model.consent.version.value &&
        this.file &&
        this.file.length === 1
      );
    });

    this.on('add-file', (event) => {
      console.log(event.data);
      if (event.data) this.file = event.data;
    });

    this.onTagClick('create-consent', async (event) => {
      try {
        if (!this.isUpdate) {
          this.model.submitButtonDisabled = true;
          const consent = {
            name: this.model.consent.name.value,
            type: this.model.consent.type.value,
            id: this.model.consent.id.value,
            versions: [
              {
                version: this.model.consent.version.value,
                versionDate: new Date().toISOString(),
                file: this.file[0],
              },
            ],
          };
          const result = await this.consentsService.createConsent(consent, this.keySSI);
          this.model.submitButtonDisabled = false;
          this.send('confirmed', result);
        } else {
          const version = {
            version: this.model.consent.version.value,
            versionDate: new Date().toISOString(),
            file: this.file[0],
          };

          const result = await this.consentsService.updateConsent(version, this.keySSI, this.isUpdate.keySSI);
          this.model.submitButtonDisabled = false;
          this.send('confirmed', result);
        }
      } catch (error) {
        this.send('closed', new Error('There was an issue creating the trial'));
        console.log(error);
      }
    });
  }
}
