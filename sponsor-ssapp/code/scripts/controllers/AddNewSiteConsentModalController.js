import { consentTypeEnum } from '../constants/consent.js';
import ConsentService from '../services/ConsentService.js';

// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewSiteConsentModalController extends WebcController {
  typesArray = Object.entries(consentTypeEnum).map(([k, v]) => ({ value: v, label: v }));

  type = {
    label: 'Select type',
    placeholder: 'Please select an option',
    required: true,
    selectOptions: this.typesArray,
    value: null,
    disabled: true,
  };

  existingNames = {
    disabled: false,
    label: 'Select a main consent:',
    placeholder: 'Please select an option',
    required: false,
    options: [],
  };

  name = {
    readOnly: false,
    label: 'Name',
    name: 'name',
    required: true,
    placeholder: 'Please insert a name...',
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
    this.consents = props[0].consents || [];
    console.log(this.consents);

    let { id, keySSI } = this.history.location.state;

    this.keySSI = keySSI;

    this.consentsService = new ConsentService(this.DSUStorage);

    if (this.isUpdate) {
      this.setModel({
        consent: {
          id: { ...this.id, value: this.isUpdate.id, readOnly: true },
          name: { ...this.name, value: this.isUpdate.name, readOnly: true },
          type: { ...this.type, value: this.isUpdate.type, disabled: true },
          version: this.version,
          attachment: this.attachment,
          existingNames: {
            ...this.existingNames,
            options: this.consents.map((x) => ({ label: x, value: x, selected: false })),
          },
        },
        submitButtonDisabled: true,
        disableRadio: true,
        consentsExists: this.consents.length > 0,
      });
    } else {
      this.setModel({
        consent: {
          id: this.id,
          name: this.name,
          existingNames: {
            ...this.existingNames,
            options: this.consents.map((x) => ({ label: x.name, value: x.keySSI, selected: false })),
          },
          // type: {...this.type },
          version: this.version,
          attachment: this.attachment,
        },
        submitButtonDisabled: true,
        disableRadio: this.consents.length === 0,
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
          let name = '';
          if (this.model.isNotUpdate) {
            const nameSelected = document.querySelector('input[name="name"]:checked').value;
            if (nameSelected === 'new') {
              name = this.model.consent.name.value;
            } else {
              name = this.model.consent.existingNames.value;
            }
            if (!name || name === '') {
              valid = false;
            }
          } else {
            name = this.model.consent.name.value;
          }

          for (const x in this.model.consent) {
            // TODO: check if file selected
            if (
              (!this.model.consent[x].value || this.model.consent[x].value === '') &&
              x !== 'attachment' &&
              x !== 'name' &&
              x !== 'existingNames'
            ) {
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
            name,
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
          const result = await this.consentsService.createConsent(consent, this.keySSI, this.site);
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

          console.log(this.existingVersions);
          console.log(this.model.consent.version.value);

          if (this.existingVersions.indexOf(this.model.consent.version.value) > -1 || !this.file || !this.file[0]) {
            valid = false;
          }

          if (!valid) return;

          const version = {
            version: this.model.consent.version.value,
            versionDate: new Date().toISOString(),
            file: this.file[0],
          };

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
