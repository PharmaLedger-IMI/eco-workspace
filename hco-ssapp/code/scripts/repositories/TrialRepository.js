import SharedStorage from "../services/SharedStorage.js";

class TrialRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'trials';
    }

    create = (key, trial, callback) => this.StorageService.insertRecord(this.tableName, key, trial, callback);

    async createAsync(key, trial) {
        return this.StorageService.insertRecordAsync(this.tableName, key, trial)
    }

    findBy = (key, callback) => this.StorageService.getRecord(this.tableName, key, callback);

    async findByAsync(key) {
        return this.StorageService.getRecordAsync(this.tableName, key)
    }
}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.trialRepositoryInstance === "undefined") {
            window.trialRepositoryInstance = new TrialRepository(DSUStorage);
        }
        return window.trialRepositoryInstance;
    }
}
