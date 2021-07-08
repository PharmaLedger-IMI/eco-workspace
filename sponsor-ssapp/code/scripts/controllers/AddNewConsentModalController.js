import { consentTypeEnum } from '../constants/consent.js';
import NewConsentService from '../services/NewConsentService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewConsentModalController extends WebcController {
  typesArray = Object.entries(consentTypeEnum)
    .map(([k, v]) => `${v}, ${v}`)
    .join(' | ');

  type = {
    label: 'Select type',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.typesArray,
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
    this.existingIds = props[0].existingIds || null;
    this.existingVersions = props[0].existingVersions || null;
    this.site = props[0].site || null;

    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;

    this.consentsService = new NewConsentService(this.DSUStorage);

    if (this.isUpdate) {
      this.setModel({
        consent: {
          id: { ...this.id, value: this.isUpdate.id, readOnly: true },
          name: { ...this.name, value: this.isUpdate.name, readOnly: true },
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
    const idField = this.element.querySelector('#id-field');
    idField.addEventListener('keydown', () => {
      setTimeout(() => {
        if (this.existingIds && this.existingIds.indexOf(this.model.consent.id.value) > -1) {
          this.model.consent.id = {
            ...this.model.consent.id,
            invalidValue: true,
          };
          return;
        }
        this.model.consent.id = {
          ...this.model.consent.id,
          invalidValue: null,
        };
      }, 300);
    });

    const versionField = this.element.querySelector('#version-field');
    versionField.addEventListener('keydown', () => {
      setTimeout(() => {
        if (this.existingVersions && this.existingVersions.indexOf(this.model.consent.version.value) > -1) {
          this.model.consent.version = {
            ...this.model.consent.version,
            invalidValue: true,
          };
          return;
        }
        this.model.consent.version = {
          ...this.model.consent.version,
          invalidValue: null,
        };
      }, 300);
    });

    this.on('add-file', (event) => {
      if (event.data) this.file = event.data;
    });

    this.onTagClick('create-consent', async (event) => {
      try {
        if (!this.isUpdate) {
          let valid = true;
          for (const x in this.model.consent) {
            // TODO: check if file selected
            if ((!this.model.consent[x].value || this.model.consent[x].value === '') && x !== 'attachment') {
              this.model.consent[x] = {
                ...this.model.consent[x],
                invalidValue: true,
              };
              setTimeout(() => {
                this.model.consent[x] = {
                  ...this.model.consent[x],
                  invalidValue: null,
                };
              }, 1000);
              valid = false;
            }
          }

          if (this.existingIds.indexOf(this.model.consent.id.value) > -1 || !this.file || !this.file[0]) {
            valid = false;
          }

          if (!valid) return;

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
          let valid = true;

          if (!this.model.consent.version.value || this.model.consent.version.value === '') {
            this.model.consent.version = {
              ...this.model.consent.version,
              invalidValue: true,
            };
            setTimeout(() => {
              this.model.consent.version = {
                ...this.model.consent.version,
                invalidValue: null,
              };
            }, 1000);
            valid = false;
          }

          if (this.existingVersions.indexOf(this.model.consent.version.value) > -1 || !this.file || !this.file[0]) {
            valid = false;
          }

          if (!valid) return;

          const version = {
            version: this.model.consent.version.value,
            versionDate: new Date().toISOString(),
            file: this.file[0],
          };

          // console.log(JSON.stringify(this.site, null, 2), JSON.stringify(this.isUpdate, null, 2));
          const result = await this.consentsService.updateConsent(version, this.keySSI, this.site, this.isUpdate);
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
