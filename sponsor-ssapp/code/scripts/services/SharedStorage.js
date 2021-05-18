const opendsu = require("opendsu");
const keySSISpace = opendsu.loadApi('keyssi')

class SharedStorage {

    constructor(DSUStorage) {
        this.DSUStorage = DSUStorage;
        this.getSharedSSI((err, sharedSSI) => {
            if (err || !sharedSSI) {
                return console.error('Database initialization failed.');
            }
            this.mydb = opendsu.loadApi('db').getWalletDB(sharedSSI, 'sharedDB');
        })
    }

    filter = (tableName, query, sort, limit, callback) => this.letDatabaseInit()
        .then(() => this.mydb.filter(tableName, query, sort, limit, callback)).catch(this.logError);

    filterAsync = async (tableName, query, sort, limit) => this.asyncMyFunction(this.filter, [tableName, query, sort, limit]);

    getRecord = (tableName, key, callback) => this.letDatabaseInit()
        .then(() => this.mydb.getRecord(tableName, key, callback)).catch(this.logError);

    getRecordAsync = async (tableName, key) => this.asyncMyFunction(this.getRecord, [tableName, key]);

    insertRecord = (tableName, key, record, callback) => this.letDatabaseInit()
        .then(() => this.mydb.insertRecord(tableName, key, record, callback)).catch(this.logError);

    insertRecordAsync = async (tableName, key, record) => this.asyncMyFunction(this.insertRecord, [tableName, key, record]);

    updateRecord = (tableName, key, record, callback) => this.letDatabaseInit()
        .then(() => this.mydb.updateRecord(tableName, key, record, callback)).catch(this.logError);

    updateRecordAsync = async (tableName, key, record) => this.asyncMyFunction(this.updateRecord, [tableName, key, record]);

    beginBatch = () => this.letDatabaseInit()
        .then(() => this.mydb.beginBatch()).catch(this.logError);

    beginBatchAsync = async () => this.asyncMyFunction(this.beginBatch, []);

    cancelBatch = (callback) => this.letDatabaseInit()
        .then(() => this.mydb.cancelBatch(callback)).catch(this.logError);

    cancelBatchAsync = async () => this.asyncMyFunction(this.cancelBatch, []);

    commitBatch = (callback) => this.letDatabaseInit()
        .then(() => this.mydb.commitBatch(callback)).catch(this.logError);

    commitBatchAsync = async () => this.asyncMyFunction(this.commitBatch, []);

    letDatabaseInit = () => {
        return new Promise((resolve) => {
            const checkDatabaseState = () => {
                if (this.mydb !== undefined) {
                    clearInterval(repeatDatabaseCheck);
                    resolve();
                }
            }
            let repeatDatabaseCheck = setInterval(checkDatabaseState, 10);
        });
    }

    logError = (err) => {
        console.error(err);
    }

    asyncMyFunction = (func, params) => {
        return new Promise((resolve, reject) => {
            func(...params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            })
        })
    }

    getSharedSSI = (callback) => {
        const databaseSharedSSIPath = 'dbSharedSSI.json';
        this.DSUStorage.getItem(databaseSharedSSIPath, (err, content) => {
            if (err) {
                return this.createSharedSSI(databaseSharedSSIPath, callback);
            }
            let textDecoder = new TextDecoder('utf-8');
            let fileContent = JSON.parse(textDecoder.decode(content));
            const parsedSSI = keySSISpace.parse(fileContent.sharedSSI);
            callback(undefined, parsedSSI);
        });
    }

    createSharedSSI = (databaseSharedSSIPath, callback) => {
        const ssi = keySSISpace.createSeedSSI('default');
        let sharedSSIObject = {sharedSSI: ssi.derive().getIdentifier()};
        this.DSUStorage.setObject(databaseSharedSSIPath, sharedSSIObject, (err) => callback(err, ssi));
    }
}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.sharedStorageInstance === "undefined") {
            window.sharedStorageInstance = new SharedStorage(DSUStorage)
        }
        return window.sharedStorageInstance;
    }
}