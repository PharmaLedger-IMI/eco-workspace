import ConsentService from '../services/ConsentService.js';
const commonServices = require('common-services');
const { getCommunicationServiceInstance } = commonServices.CommunicationService;
const Constants = commonServices.Constants;
// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class AddNewSiteConsentModalController extends WebcController {
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

  file = {
    label: 'Consent FIle',
    name: 'file',
    required: true,
    placeholder: 'Please select a file...',
    value: null,
    invalidValue: false,
  };

  isUpdate = false;

  constructor(...props) {
    super(...props);

    this.site = props[0].site || null;
    this.consents = props[0].consents || [];
    this.selectedConsent = props[0].selectedConsent || [];
    console.log(this.consents);

    let { trialKeySSI } = this.history.location.state;

    this.keySSI = trialKeySSI;

    this.consentsService = new ConsentService(this.DSUStorage);

    this.setModel({
      consent: {
        file: this.file,
        type: this.selectedConsent.type,
        trialConsentName: this.selectedConsent.name,
        trialConsentId: this.selectedConsent.id,
        trialConsentVersion: Math.max.apply(
          Math,
          this.selectedConsent.versions.map((o) => parseInt(o.version))
        ),
        name: this.name,
        version: {
          ...this.version,
          value: null,
        },
        attachment: this.attachment,
      },
      submitButtonDisabled: true,
    });
    this.attachAll();
  }

  attachAll() {
    this.on('add-file', (event) => {
      console.log(event);
      if (event.data) {
        this.model.consent.file.value = event.data;
      }
      if (!event.data || event.data.length === 0) {
        this.model.consent.file.value = null;
      }
    });

    this.onTagClick('create-consent', async () => {
      try {
        console.log(JSON.parse(JSON.stringify(this.model.consent)));
        let valid = true;
        for (const x in this.model.consent) {
          // TODO: check if file selected
          if (!this.model.consent.name.value || this.model.consent.name.value === '') {
            Object.assign(this.model.consent.name, { invalidValue: true });
            setTimeout(() => {
              Object.assign(this.model.consent.name, { invalidValue: null });
            }, 1000);
            valid = false;
          }

          if (!this.model.consent.file.value || this.model.consent.file.value === '') {
            Object.assign(this.model.consent.file, { invalidValue: true });
            setTimeout(() => {
              Object.assign(this.model.consent.file, { invalidValue: null });
            }, 1000);
            valid = false;
          }
        }

        const existingVersions = this.selectedConsent.versions.map((o) => parseInt(o.version));
        const selectedValue = parseInt(this.model.consent.version.value);
        const smallerThan = selectedValue < Math.max.apply(Math, existingVersions);
        const versionExists = existingVersions.indexOf(selectedValue) > -1;

        if (smallerThan || versionExists) {
          Object.assign(this.model.consent.version, { invalidValue: true });
          setTimeout(() => {
            Object.assign(this.model.consent.version, { invalidValue: null });
          }, 1000);
          valid = false;
        }

        console.log(JSON.parse(JSON.stringify(this.model.consent)));
        if (!valid) return;

        const result = {
          trialConsentVersion: this.model.consent.trialConsentVersion,
          trialConsentId: this.model.consent.trialConsentId,
          trialConsentName: this.model.consent.trialConsentName,
          file: this.model.consent.file.value[0],
          type: this.model.consent.type,
          versions: [
            {
              version: this.model.consent.version.value,
              versionDate: new Date().toISOString(),
              file: this.model.consent.file.value[0],
            },
          ],
          name: this.model.consent.name.value,
        };

        let outcome = null;
        const exists = this.site.consents.find((x) => x.trialConsentId === this.model.consent.trialConsentId && x.name);
        if (exists) {
          outcome = await this.consentsService.addSiteConsentVersion(result, this.keySSI, this.site);
          this.sendMessageToHco(
            Constants.MESSAGES.SPONSOR.UPDATE_ECOSENT,
            this.site.uid,
            'Site consent',
            this.site.did,
            outcome.uid
          );
        } else {
          outcome = await this.consentsService.addSiteConsent(result, this.keySSI, this.site);
          // this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_CONSENT, outcome.sReadSSI, 'Site consent', this.site.did);
          this.sendMessageToHco(Constants.MESSAGES.HCO.ADD_CONSENT, this.site.uid, 'Site consent', this.site.did);
        }
        this.model.submitButtonDisabled = false;
        this.send('confirmed', outcome);
      } catch (error) {
        this.send('closed', new Error('There was an issue creating the site consent'));
        console.log(error);
      }
    });
  }

  sendMessageToHco(operation, ssi, shortMessage, receiverDid, econsentUid = null) {
    let communicationService = getCommunicationServiceInstance();
    const message = {
      operation: operation,
      ssi: ssi,
      shortDescription: shortMessage,
    };

    if (econsentUid) {
      message.econsentUid = econsentUid;
    }
    communicationService.sendMessage(receiverDid, message);
  }
}
