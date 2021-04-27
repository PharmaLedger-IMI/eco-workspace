
import EconsentModel from "../../models/EconsentModel.js";

export default class EconsentService {

    ECONSENTS_PATH = "/econsents";

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
    }

    getServiceModel(callback){
        this.DSUStorage.call('listDSUs', this.ECONSENTS_PATH, (err, dsuList) => {
            if (err){
                callback(err, undefined);
                return;
            }
            let econsents = [];
            let getServiceDsu = (dsuItem) => {
                this.DSUStorage.getItem(this._getDsuStoragePath(dsuItem.identifier), (err, content) => {
                    if (err)
                    {
                        econsents.slice(0);
                        callback(err, undefined);
                        return;
                    }
                    let textDecoder = new TextDecoder("utf-8");
                    let econsent = JSON.parse(textDecoder.decode(content));
                    econsents.push(econsent);

                    if (dsuList.length === 0)
                    {
                        const model = new EconsentModel()._getWrapperData();
                        model.econsents = econsents;
                        callback(undefined, model);
                        return;
                    }
                    getServiceDsu(dsuList.shift());
                })
            };


            if (dsuList.length === 0){
                const model = new EconsentModel()._getWrapperData();
                callback(undefined, model);
                return;
            }
            getServiceDsu(dsuList.shift());
        })

    }

    getEconsent(uid, callback){
        this.DSUStorage.getItem(this._getDsuStoragePath(uid), (err, content) => {
            if (err)
            {
                callback(err, undefined);
                return;
            }
            let textDecoder = new TextDecoder("utf-8");
            let econsent = JSON.parse(textDecoder.decode(content));
            callback(undefined, econsent);
        })
    }

    saveEconsent(data, callback){
        this.DSUStorage.call('createSSIAndMount',this.ECONSENTS_PATH, (err, keySSI) => {
            if (err)
            {
                callback(err,undefined);
                return;
            }
            data.KeySSI = keySSI;
            data.uid = keySSI;
            this.updateEconsent(data, callback);
        })
    }
    mountEconsent(keySSI, callback){
        this.DSUStorage.call('mount',this.ECONSENTS_PATH, keySSI, (err) =>{
            if (err)
            {
                return callback(err, undefined);
            }

            this.getEconsent(keySSI, (err, org) =>{
                if (err)
                {
                    return callback(err, undefined);
                }
                callback(undefined, org);
            })


        })
    }
    updateEconsent(data, callback){
        this.DSUStorage.setObject(this._getDsuStoragePath(data.uid), data, (err) => {
            if (err){
                callback(err, undefined);
                return;
            }
            callback(undefined, data);
        })
    }

    unmountEconsent(diaryUid, callback) {
        let unmountPath = this.ECONSENTS_PATH + '/' + diaryUid;
        this.DSUStorage.call('econsentUnmount', unmountPath, (err, result) => {
            if (err) {
                callback(err, undefined);
                return;
            }
            callback(undefined, result);
        });
    }

    _getDsuStoragePath(keySSI){
        return this.ECONSENTS_PATH + '/' + keySSI + '/data.json';
    }
}