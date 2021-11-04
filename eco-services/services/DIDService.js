const DIDConstants = require('../internal/DIDConstants.js')

class DIDModalHandler {

    constructor(controllerReference) {
        this.ControllerReference = controllerReference;
        const DSUService = require('./DSUService.js')
        this.DSUService = new DSUService(controllerReference.DSUStorage);
        this._initControllerDIDModel();
        this._initDidModal();
        this._saveButtonHandler();

        this._getUserProfile((err, userProfile) => {
            if (err) {
                return console.error('User profile missing.', err);
            }
            this.ControllerReference.model.didModel.did.value = userProfile.username + ':' + userProfile.email;
        });
    }

    _initControllerDIDModel() {
        this.ControllerReference.model.didModel = DIDConstants.INIT_MODEL;
    }

    _initDidModal() {
        let element = this.ControllerReference.element;
        let didModalProps = {
            tagName: 'div',
            id: 'did-modal',
            style: DIDConstants.CSS.MODAL_PARENT
        }
        let didModalContentProps = {
            tagName: 'div',
            id: 'did-modal-content',
            style: DIDConstants.CSS.MODAL_CONTENT
        }
        let didModal = this._getElementByProps(didModalProps);
        let didModalContent = this._getElementByProps(didModalContentProps);
        let header = this._getElementByProps({
            tagName: 'h3',
            id: 'did-modal-header',
            style: DIDConstants.CSS.MODAL_HEADER,
            text: 'Please create your desired DID'
        });

        let top = this._getElementByProps({
            tagName: 'div',
            id: 'did-modal-top',
            style: DIDConstants.CSS.MODAL_TOP
        });
        top.innerHTML = `<psk-input id="did" view-model="@didModel.did">`

        let middle = this._getElementByProps({
            tagName: 'div',
            id: 'did-modal-middle',
            style: DIDConstants.CSS.MODAL_MIDDLE
        });
        middle.innerHTML = `<psk-label style="color: red" label="@didModel.errorMessage">
                            <psk-label style="color: green" label="@didModel.successMessage">`

        let bottom = this._getElementByProps({
            tagName: 'div',
            id: 'did-modal-bottom',
            style: {}
        });

        let footer = this._getElementByProps({
            tagName: 'div',
            id: 'did-modal-footer',
            style: DIDConstants.CSS.MODAL_FOOTER
        });
        footer.appendChild(this._getButtonWithTextAndTag('did-modal-save-button', 'Save', 'did:save'));
        footer.appendChild(this._getButtonWithTextAndTag('did-modal-exit-button', 'Done', 'did:exit', true));

        didModalContent.appendChild(header);
        didModalContent.appendChild(top);
        didModalContent.appendChild(middle);
        didModalContent.appendChild(bottom);
        didModalContent.appendChild(footer);
        didModal.appendChild(didModalContent);
        element.appendChild(didModal);
    }

    _getButtonWithTextAndTag(id, text, tag, hidden = false) {
        let btn = this._getElementByProps({
            tagName: 'button',
            id: id,
            style: DIDConstants.CSS.MODAL_BUTTON
        });
        if (hidden) {
            btn.style.visibility = 'hidden';
            btn.style.padding = '0';
            btn.style.width = '0';
            btn.style.height = '0';
        }
        btn.setAttribute('data-tag', tag);
        btn.innerText = text;
        return btn;
    }

    _saveButtonHandler() {
        this.ControllerReference.onTagEvent('did:save', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            let patternErrorMessage = this._getPatternErrorMessage();
            if (patternErrorMessage) {
                this.ControllerReference.model.didModel.errorMessage = patternErrorMessage;
                return;
            }
            this._setDID(this.ControllerReference.model.didModel.did.value, (err, didFile) => {
                if (err) {
                    return console.error('There was an error saving the DID.', err);
                }
                this.ControllerReference.model.didModel.confirmedDid = didFile.did;
                this.ControllerReference.model.didModel.did.readOnly = true;
                this.ControllerReference.model.didModel.title = 'Share your DID';
                this.ControllerReference.model.didModel.errorMessage = null;
                this.ControllerReference.model.didModel.successMessage = DIDConstants.MESSAGES.SUCCESS;
                this.ControllerReference.querySelector('#did-modal-bottom').innerHTML = `<psk-barcode-generator type="qrcode" size="16" data="@didModel.confirmedDid"></psk-barcode-generator>`;
                this.ControllerReference.querySelector('#did-modal-save-button').style.display = 'none';
                let exitButton = this.ControllerReference.querySelector('#did-modal-exit-button');
                exitButton.style.visibility = 'visible';
                Object.keys(DIDConstants.CSS.MODAL_BUTTON).forEach(styleKey => {
                    exitButton.style[styleKey] = DIDConstants.CSS.MODAL_BUTTON[styleKey];
                })
            });
        });
    }

    _getPatternErrorMessage() {
        let currentDID = this.ControllerReference.model.didModel.did.value;
        return DIDConstants.DID_PATTERN.test(currentDID) ? undefined : DIDConstants.MESSAGES.ERROR;
    }

    _getUserProfile(callback) {
        this.ControllerReference.DSUStorage.getItem('user-details.json', (err, content) => {
            if (err) {
                return callback(err, undefined);
            }
            let textDecoder = new TextDecoder("utf-8");
            let entity = JSON.parse(textDecoder.decode(content));
            callback(undefined, entity);
        })
    }

    _getElementByProps(props) {
        let elem = document.createElement(props.tagName);
        elem.id = props.id;
        Object.keys(props.style).forEach(styleKey => {
            elem.style[styleKey] = props.style[styleKey];
        })
        if (props.text) {
            elem.appendChild(document.createTextNode(props.text));
        }
        return elem;
    }

    _setDID(did, callback) {
        let didFile = {
            did: did
        }
        this.ControllerReference.DSUStorage.setObject('did.json', didFile, (err) => {
            if (err) {
                return callback(err, undefined);
            }
            callback(undefined, didFile);
        })
    }

    getDID(callback) {
        this.ControllerReference.onTagEvent('did:exit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            callback(undefined, this.ControllerReference.model.didModel.confirmedDid);
            this._clean();
        });
    }

    _clean() {
        this.ControllerReference.querySelector('#did-modal').remove();
    }
}

class DIDService {

    constructor(controllerReference) {
        this.controllerReference = controllerReference;
    }

    getDid(callback) {
        this.getObject('environment.json', (err, envFile) => {
            if (err) {
                return console.error('Environment json missing.', err);
            }
            let didPrompt = envFile.didPrompt;
            if (didPrompt === undefined || didPrompt === false) {
                return callback(undefined, (envFile.appName || 'mockAppName').replace('-wallet', ''));
            }
            this.getObject('did.json', (err, did) => {
                if (err || did.did === undefined) {
                    let didModalHandler = new DIDModalHandler(this.controllerReference);
                    return didModalHandler.getDID(callback);
                }
                callback(undefined, did.did);
            });
        });
    }

    getObject(path, callback) {
        this.controllerReference.DSUStorage.getItem(path, (err, content) => {
            if (err) {
                return callback(err, undefined);
            }
            let textDecoder = new TextDecoder("utf-8");
            let entity = JSON.parse(textDecoder.decode(content));
            callback(undefined, entity);
        })
    }
}

let didServiceInstance = null;
let communicationServiceInstance = null;

let getDid = (controllerReference, callback) => {
    if (typeof callback !== 'function') {
        callback = () => {
        };
    }
    if (didServiceInstance === null) {
        didServiceInstance = new DIDService(controllerReference);
        didServiceInstance.getDid((err, data) => {
            callback(err, data);
            didServiceInstance = null;
        });
    }
}

let getDidAsync = (controllerReference) => {
    return asyncMyFunction(getDid, [controllerReference])
}

let getCommunicationServiceInstance = (controllerReference, callback) => {
    if (communicationServiceInstance !== null) {
        return callback(undefined, communicationServiceInstance);
    }
    let localDidService = new DIDService(controllerReference);
    localDidService.getObject('environment.json', (err, envFile) => {
        let personalIdentity = {};
        if (envFile === undefined) {
            envFile = {
                workspace: 'mockDomain',
                appName: 'mockActor'
            }
        }
        personalIdentity.domain = envFile.workspace;
        personalIdentity.app = (envFile.appName || 'mockAppName').replace('-wallet', '');

        localDidService.getDid((err, did) => {
            if (err || did === undefined) {
                personalIdentity.did = envFile.appName;
            } else {
                personalIdentity.did = did;
            }
            const CommunicationService = require('./CommunicationService.js')
            communicationServiceInstance = CommunicationService.getInstance(personalIdentity);
            return callback(undefined, communicationServiceInstance);
        });
    });
}

let getCommunicationServiceInstanceAsync = (controllerReference) => {
    return asyncMyFunction(getCommunicationServiceInstance, [controllerReference])
}

let asyncMyFunction = (func, params) => {
    func = func.bind(this)
    return new Promise((resolve, reject) => {
        func(...params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        })
    })
}

module.exports = {
    getDid,
    getDidAsync,
    getCommunicationServiceInstance,
    getCommunicationServiceInstanceAsync
}