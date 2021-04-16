import TrialParticipantModel from "../../models/TrialParticipantModel.js";


export default class TrialParticipantsService {

    TPS_PATH = "/tps";

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    getTPS(path, callback) {
        this.DSUStorage.call('listDSUs', this.TPS_PATH +'/'+ path, (err, dsuList) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let tps = [];
            let getServiceDsu = (dsuItem) => {
                this.DSUStorage.getItem(this._getDsuStoragePath(dsuItem.identifier), (err, content) => {
                    if (err) {
                        tps.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    debugger;
                    let textDecoder = new TextDecoder("utf-8");
                    let tp = JSON.parse(textDecoder.decode(content));
                    tps.push(tp);

                    if (dsuList.length === 0) {
                        const model = new TrialParticipantModel()._getWrapperData();
                        model.tps = tps;
                        callback(undefined, model);
                        return;
                    }
                    getServiceDsu(dsuList.shift());
                })
            };


            if (dsuList.length === 0) {
                const model = new TrialParticipantModel()._getWrapperData();
                callback(undefined, model);
                return;
            }
            getServiceDsu(dsuList.shift());
        })

    }

    getTrialParticipant(uid, callback) {
        this.DSUStorage.getItem(this._getDsuStoragePath(uid), (err, content) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            let textDecoder = new TextDecoder("utf-8");
            let tp = JSON.parse(textDecoder.decode(content));
            callback(undefined, tp);
        })
    }


    saveTrialParticipant(tp, callback) {


        this.DSUStorage.call('createSSIAndMount', this.TPS_PATH+'/'+tp.trialNumber, (err, keySSI) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            tp.KeySSI = keySSI;
            tp.uid = keySSI;
            this.updateTrialParticipant(tp, callback);
        })
    }

    mountTrialParticipant(keySSI, callback) {
        this.DSUStorage.call('mount', this.TPS_PATH, keySSI, (err) => {
            if (err) {
                return callback(err, undefined);
            }

            this.getTrialParticipant(keySSI, (err, tp) => {
                if (err) {
                    return callback(err, undefined);
                }
                callback(undefined, tp);
            })


        })
    }

    updateTrialParticipant(data, callback) {
        this.DSUStorage.setObject(this._getDsuStoragePath(data.uid), data, (err) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, data);
        })
    }

    unmountTrialParticipant(uid, callback) {
        let unmountPath = this.TPS_PATH + '/' + uid;
        this.DSUStorage.call('trialParticipantUnmount', unmountPath, (err, result) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, result);
        });
    }

    _getDsuStoragePath(keySSI) {
        return this.TPS_PATH + '/' + keySSI + '/data.json';
    }
}