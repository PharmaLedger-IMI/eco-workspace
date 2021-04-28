const KEYSSI_FILE_PATH = 'keyssi.json';
const KEYSSI_PATH = '/sharedDB';
const SHARED_DB = 'sharedDB';

class SharedStorage {
  constructor(dsuStorage) {
    this.DSUStorage = dsuStorage;
    this.DSUStorage.enableDirectAccess(() => {
      this.init();
    });
  }

  async init() {
    try {
      this.myDb = 'initializing';
      const sharedSSI = await this.getSharedSSI();
      let db = require('opendsu').loadAPI('db');
      this.myDb = db.getWalletDB(sharedSSI, SHARED_DB);
    } catch (error) {
      console.log(error);
      alert('Wrong configuration as user/holder:');
    }
  }

  waitForDb(func, args) {
    func = func.bind(this);
    setTimeout(function () {
      func(...args);
    }, 10);
  }

  dbReady() {
    return this.myDb !== undefined && this.myDb !== 'initializing';
  }

  filter(tableName, query, sort, limit, callback) {
    if (this.dbReady()) {
      this.myDb.filter(tableName, query, sort, limit, callback);
    } else {
      this.waitForDb(this.filter, [tableName, query, sort, limit, callback]);
    }
  }

  addSharedFile(path, value, callback) {
    throw Error('Not implemented');
  }

  getRecord(tableName, key, callback) {
    if (this.dbReady()) {
      this.myDb.getRecord(tableName, key, callback);
    } else {
      this.waitForDb(this.getRecord, [tableName, key, callback]);
    }
  }

  insertRecord(tableName, key, record, callback) {
    if (this.dbReady()) {
      console.log('Insert Record:', tableName, key);
      this.myDb.insertRecord(tableName, key, record, callback);
    } else {
      this.waitForDb(this.insertRecord, [tableName, key, record, callback]);
    }
  }

  updateRecord(tableName, key, record, callback) {
    if (this.dbReady()) {
      this.myDb.updateRecord(tableName, key, record, callback);
    } else {
      this.waitForDb(this.updateRecord, [tableName, key, record, callback]);
    }
  }

  beginBatch() {
    if (this.dbReady()) {
      this.myDb.beginBatch();
    } else {
      this.waitForDb(this.beginBatch);
    }
  }

  cancelBatch(callback) {
    if (this.dbReady()) {
      this.myDb.cancelBatch(callback);
    } else {
      this.waitForDb(this.cancelBatch, [callback]);
    }
  }

  commitBatch(callback) {
    if (this.dbReady()) {
      this.myDb.commitBatch(callback);
    } else {
      this.waitForDb(this.commitBatch, [callback]);
    }
  }

  async getSharedSSI() {
    // const fileList = await this.listFiles('/');
    // if (fileList.includes(KEYSSI_FILE_PATH)) {
    //   const data = await this.getItem(KEYSSI_FILE_PATH);
    //   return data.sharedSSI;
    // } else {
    //   const data = await this.createSharedSSI();
    //   return data.sharedSSI;
    // }
    const result = await this.createSharedSSI();
    return result;
  }

  async createSharedSSI() {
    const result = await this.createSSIAndMount(KEYSSI_PATH);
    console.log('keySSI:', result.keySSIInstance);
    // const result = await this.setItem(KEYSSI_FILE_PATH, { sharedSSI: keySSI });
    // const test = await this.setItem(KEYSSI_PATH + '/test.json', { test: '' });
    // const test2 = await this.setItem('/test.json', { test2: '' });
    return result.keySSIInstance;
  }

  getItem(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.getItem(path, (err, content) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        let textDecoder = new TextDecoder('utf-8');
        let json = JSON.parse(textDecoder.decode(content));
        resolve(json);
      });
    });
  }

  setItem(path, content) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.setObject(path, content, async (err) => {
        console.log(path, content);
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(content);
      });
    });
  }

  createSSIAndMount(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('createSSI', path, (err, keySSIObject) => {
        if (err) {
          reject(new Error(err));
          return;
        }

        const keyssi = require('opendsu').loadApi('keyssi');

        const result = keyssi.parse(keySSIObject);
        resolve({ keySSIInstance: result });
      });
    });
  }

  listFiles(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('listFiles', path, async (err, result) => {
        if (err) {
          console.log(err);
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }
}

export default function getSharedStorage(dsuStorage) {
  if (typeof window.sharedStorageSingleton === 'undefined') {
    window.sharedStorageSingleton = new SharedStorage(dsuStorage);
  }

  return window.sharedStorageSingleton;
}
