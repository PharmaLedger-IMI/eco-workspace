import TrialModel from '../../models/TrialModel.js';

export default class TrialService {

    SERVICE_PATH = "/trials";

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    getServiceModel(callback) {
        this.DSUStorage.call('listDSUs', this.SERVICE_PATH, (err, dsuList) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let organisations = [];
            let getServiceDsu = (dsuItem) => {
                this.DSUStorage.getItem(this._getDsuTrialPath(dsuItem.identifier), (err, content) => {
                    if (err) {
                        organisations.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    let textDecoder = new TextDecoder("utf-8");
                    let trial = JSON.parse(textDecoder.decode(content));
                    organisations.push(trial);

                    if (dsuList.length === 0) {
                        const model = new TrialModel()._getWrapperData();
                        model.trials = organisations;
                        callback(undefined, model);
                        return;
                    }
                    getServiceDsu(dsuList.shift());
                })
            };


            if (dsuList.length === 0) {
                const model = new TrialModel()._getWrapperData();
                callback(undefined, model);
                return;
            }
            getServiceDsu(dsuList.shift());
        })

    }

    getTrial(uid, callback) {
        this.DSUStorage.getItem(this._getDsuTrialPath(uid), (err, content) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let textDecoder = new TextDecoder("utf-8");
            let trial = JSON.parse(textDecoder.decode(content));

            callback(undefined, trial);
        })
    }

    saveTrial(data, callback) {
        debugger
        this.DSUStorage.call('createSSIAndMount', this.SERVICE_PATH, (err, keySSI) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            data.KeySSI = keySSI;
            data.uid = keySSI;
            this.updateTrial(data, callback);
        })
    }

    mountTrial(keySSI, callback) {
        this.DSUStorage.call('mount', this.SERVICE_PATH, keySSI, (err) => {
            if (err) {
                return callback(err, undefined);
            }

            this.getTrial(keySSI, (err, trial) => {
                debugger
                if (err) {
                    return callback(err, undefined);
                }
                callback(undefined, trial);
            })


        })
    }

    updateTrial(data, callback) {
        //Todo add file - read the file in a var and in set object the second param will be that var
        // uid is the same with keyssi
        this.DSUStorage.setObject(this._getDsuTrialPath(data.uid), data, (err) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, data);
        })
    }

    unmountTrial(orgUid, callback) {
        let unmountPath = this.SERVICE_PATH + '/' + orgUid;
        this.DSUStorage.call('organizationUnmount', unmountPath, (err, result) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, result);
        });
    }

    getEconsents(trialSSI, callback) {
        this.DSUStorage.call('listDSUs', this._getEconsentsDsuList(trialSSI), (err, dsuList) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let econsents = [];
            let getServiceDsu = (dsuItem) => {
                this.DSUStorage.getItem(this._getEconsentDsuPath(trialSSI, dsuItem.identifier), (err, content) => {
                    if (err) {
                        econsents.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    let textDecoder = new TextDecoder("utf-8");
                    let trial = JSON.parse(textDecoder.decode(content));
                    econsents.push(trial);

                    if (dsuList.length === 0) {
                        const model = {};
                        model.econsents = econsents;
                        callback(undefined, model);
                        return;
                    }
                    getServiceDsu(dsuList.shift());
                })
            };


            if (dsuList.length === 0) {

                callback(undefined, {econsents: []});
                return;
            }
            getServiceDsu(dsuList.shift());
        })

    }

    _getDsuTrialPath(keySSI) {
        return this.SERVICE_PATH + '/' + keySSI + '/data.json';
    }

    _getEconsentsDsuList(keySSI) {
        return this.SERVICE_PATH + '/' + keySSI + '/consent';
    }

    _getEconsentDsuPath(trialSSI, econsentSSI) {
        return this.SERVICE_PATH + '/' + trialSSI + '/consent/' + econsentSSI + '/data.json';
    }
}