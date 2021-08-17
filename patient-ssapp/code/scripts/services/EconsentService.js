import DSUService from "./DSUService.js";

export default class EconsentService extends DSUService {

    ECONSENT_PATH = "/econsents";

    constructor(DSUStorage) {
        super(DSUStorage, '/econsents');
    }

    getEconsentsStatuses = (callback) => this.getEntities(callback);

    getEconsentStatus = (uid, callback) => this.getEntity(uid, callback);

    saveEconsent = (data, callback) => this.saveEntity(data, callback);

    saveEconsentFile(file, data, callback) {
        this.DSUStorage.call('createSSIAndMount', this._getEconsentsPath(data.id), (err, keySSI) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            data.KeySSI = keySSI;
            data.uid = keySSI;
            this.DSUStorage.uploadFile(
                this._getEconsentsPath(data.id),
                file,
                undefined,
                (err, keySSI) => {
                    if (err) {
                        callback(err, undefined);
                        return;
                    }
                    console.log("The econsent file is saved  ");
                }
            );
        })
    }

    _getEconsentsPath(ecosentID) {

        return this.ECONSENT_PATH + '/' + ecosentID;
    }

    mountEconsent = (keySSI, callback) => this.mountEntity(keySSI, callback);

    updateEconsent = (data, callback) => this.updateEntity(data, callback);

    unmountEconsent = (uid, callback) => this.unmountEntity(data, callback);
}