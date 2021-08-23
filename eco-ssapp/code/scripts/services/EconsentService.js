
import EconsentModel from "../models/EconsentModel.js";

export default class EconsentService {

    TRIAL_PATH = "/trials";
    ECONSENt_PATH = "/econsent";

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    getEconsentsModel(trialID, callback) {


        let econsentPath = this._getEconsentsPath(trialID);
        this.DSUStorage.call('listDSUs', econsentPath, (err, dsuList) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let econsents = [];
            let getEconsentsDSU = (dsuItem) => {
                this.DSUStorage.getItem(econsentPath + '/' + dsuItem.identifier + '/data.json', (err, content) => {
                    if (err) {
                        econsents.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    let textDecoder = new TextDecoder("utf-8");
                    let econsent = JSON.parse(textDecoder.decode(content));
                    econsents.push(econsent);

                    if (dsuList.length === 0) {
                        const model = new ClusterModel()._getWrapperData();
                        model.econsents = econsents;
                        callback(undefined, model);
                        return;
                    }
                    getEconsentsDSU(dsuList.shift());
                })
            };


            if (dsuList.length === 0) {
                const model = new EconsentModel()._getWrapperData();
                callback(undefined, model);
                return;
            }
            getEconsentsDSU(dsuList.shift());
        })

    }

    getEconsent(trialID, econsentID, callback) {
        this.DSUStorage.getItem(this._getEconsentPath(trialID, econsentID), (err, content) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let textDecoder = new TextDecoder("utf-8");
            let cluster = JSON.parse(textDecoder.decode(content));
            callback(undefined, cluster);
        })
    }

    saveEconsent(trialID,file, data, callback) {

        this.DSUStorage.call('createSSIAndMount', this._getEconsentsPath(trialID), (err, keySSI) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            data.KeySSI = keySSI;
            data.uid = keySSI;
            this.DSUStorage.uploadFile(
                this._getEconsentsPath(trialID),
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
            // this.updateEconsent(trialID, data, callback);
        })
    }

    updateEconsent(trialID, data, callback) {
        this.DSUStorage.setObject(this._getEconsentPath(trialID, data.uid), data, (err) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, data);
        })
    }

    unmountEconsent(trialId, econsentID, callback) {
        let econsentPath = this.ECONSENt_PATH + '/' + econsentID;
        this.DSUStorage.call('econsentUnmount', trialId, econsentPath, (err, result) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, result);
        });
    }

    _getEconsentsPath(trialID) {

        return this.TRIAL_PATH + '/' + trialID + this.ECONSENt_PATH;
    }

    _getEconsentPath(organizationSSI, clusterSSI) {
        return this._getEconsentsPath(organizationSSI) + '/' + clusterSSI + '/data.json';
    }
}