const SHARED_DB = "sharedDB";

class SharedStorage {
    constructor(dsuStorage) {
        this.DSUStorage = dsuStorage;
        this.DSUStorage.enableDirectAccess(() => {
            this.mydb = "initialising";
            debugger;
            this.getSharedSSI((err, sharedSSI) => {
                if (!err && sharedSSI) {
                    let opendsu = require("opendsu");
                    let db = opendsu.loadAPI("db");
                    this.mydb = db.getWalletDB(sharedSSI, SHARED_DB);
                } else {
                    alert("Wrong configuration as user/holder:" + err);
                }
            })
        });
    }

    waitForDb(func, args) {
        func = func.bind(this)
        setTimeout(function () {
            func(...args);
        }, 10);
    }

    dbReady() {
        return (this.mydb !== undefined && this.mydb !== "initialising");
    }

    filter(tableName, query, sort, limit, callback) {
        if (this.dbReady()) {
            this.mydb.filter(tableName, query, sort, limit, callback);
        } else {
            this.waitForDb(this.filter, [tableName, query, sort, limit, callback]);
        }
    }

    addSharedFile(path, value, callback) {
        throw Error("Not implemented")
    }

    getRecord(tableName, key, callback) {
        if (this.dbReady()) {
            this.mydb.getRecord(tableName, key, callback);
        } else {
            this.waitForDb(this.getRecord, [tableName, key, callback]);
        }
    }

    insertRecord(tableName, key, record, callback) {
        if (this.dbReady()) {
            console.log("Insert Record:", tableName, key);
            this.mydb.insertRecord(tableName, key, record, callback);

        } else {
            this.waitForDb(this.insertRecord, [tableName, key, record, callback]);
        }
    }

    updateRecord(tableName, key, record, callback) {
        if (this.dbReady()) {
            this.mydb.updateRecord(tableName, key, record, callback);
        } else {
            this.waitForDb(this.updateRecord, [tableName, key, record, callback]);
        }
    }

    beginBatch() {
        if (this.dbReady()) {
            this.mydb.beginBatch();
        } else {
            this.waitForDb(this.beginBatch);
        }
    }

    cancelBatch(callback) {
        if (this.dbReady()) {
            this.mydb.cancelBatch(callback);
        } else {
            this.waitForDb(this.cancelBatch, [callback]);
        }
    }

    commitBatch(callback) {
        if (this.dbReady()) {
            this.mydb.commitBatch(callback);
        } else {
            this.waitForDb(this.commitBatch, [callback]);
        }
    }

    getSharedSSI(callback) {
        debugger;
        this.DSUStorage.call("listDSUs", '/sharedDB', (err, list) => {
            if (err) {
                return callback(err);
            }
            if (list && list.length > 0) {
                let opendsu = require("opendsu");
                let mainSSI = opendsu.loadApi("keyssi").parse(list[0].identifier);
                return callback(undefined, mainSSI);
            } else {
                callback(undefined, undefined);
            }
        });
    }
}


export default function getSharedStorage(dsuStorage) {
    if (typeof window.sharedStorageSingleton === "undefined") {
        window.sharedStorageSingleton = new SharedStorage(dsuStorage)
    }

    return window.sharedStorageSingleton;
}