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

  file = null;
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
          value: Math.max.apply(
            Math,
            this.selectedConsent.versions.map((o) => parseInt(o.version))
          ),
          disabled: true,
        },
        attachment: this.attachment,
      },
      submitButtonDisabled: true,
    });
    this.attachAll();
  }

  attachAll() {
    this.on('add-file', (event) => {
      if (event.data) this.file = event.data;
    });

    this.onTagClick('create-consent', async () => {
      try {
        const data = JSON.parse(JSON.stringify(this.model.consent));
        const result = {
          trialConsentVersion: data.trialConsentVersion,
          trialConsentId: data.trialConsentId,
          trialConsentName: data.trialConsentName,
          file: this.file[0],
          type: data.type,
          versions: [
            {
              version: data.version.value,
              versionDate: new Date().toISOString(),
              file: this.file[0],
            },
          ],
          name: data.name.value,
        };

        console.log(result);
        let outcome = null;
        const exists = this.site.consents.find((x) => x.trialConsentId === data.trialConsentId && x.name);
        if (exists) {
          debugger;
          outcome = await this.consentsService.addSiteConsentVersion(result, this.keySSI, this.site);
          this.sendMessageToHco(
            Constants.MESSAGES.SPONSOR.UPDATE_ECOSENT,
            this.site.uid,
            'Site consent',
            this.site.did,
            outcome.uid
          );
        } else {
          debugger;
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
