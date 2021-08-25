const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;

const {WebcController} = WebCardinal.controllers;

const DID_PATTERN = /^([a-z0-9:@._-]{5,})$/;

export default class DIDModalController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            title: 'Please create your desired DID',
            did: {
                label: 'Public Identifier',
                name: 'did',
                required: true,
                placeholder: 'Public identifier',
                value: '',
            },
            errorMessage: null
        });
        this.DSUService = new DSUService(this.DSUStorage);
        this._getUserProfile((err, userProfile) => {
            if (err) {
                return console.error('User profile missing.', err);
            }
            this.model.did.value = userProfile.username + ':' + userProfile.email;
        });
        this._attachHandlerSubmit();
        this._attachHandlerExit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('did:save', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            let patternErrorMessage = this._getPatternErrorMessage();
            if (patternErrorMessage) {
                this.model.errorMessage = patternErrorMessage;
                return;
            }
            this._setDID(this.model.did.value, (err, didFile) => {
                if (err) {
                    return console.error('There was an error saving the DID.', err);
                }
                this.model.confirmedDid = didFile.did;
                this.model.did.readOnly = true;
                this.model.title = 'Share your DID';
                this.model.completed = true;
                this.model.errorMessage = null;
            });
        });
    }

    _attachHandlerExit() {
        this.onTagEvent('did:exit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            return this.send('confirmed',  this.model.confirmedDid);
        });
    }

    _getPatternErrorMessage() {
        let currentDID = this.model.did.value;
        return DID_PATTERN.test(currentDID) ? undefined : 'DID does not match the requirements';
    }

    _getUserProfile(callback) {
        this.DSUStorage.getItem('user-details.json', (err, content) => {
            if (err) {
                return callback(err, undefined);
            }
            let textDecoder = new TextDecoder("utf-8");
            let entity = JSON.parse(textDecoder.decode(content));
            callback(undefined, entity);
        })
    }

    _setDID(did, callback) {
        let didFile = {
            did: did
        }
        this.DSUStorage.setObject('did.json', didFile, (err) => {
            if (err) {
                return callback(err, undefined);
            }
            callback(undefined, didFile);
        })
    }
}
