import SharedStorage from "../services/SharedStorage.js";

class TrialParticipantRepository {

    constructor(DSUStorage) {
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.tableName = 'trials_participants';
    }

    create = (key, trialParticipant, callback) =>
        this.StorageService.insertRecord(this.tableName, key, trialParticipant, callback);

    createAsync = (key, trialParticipant) =>
        this.StorageService.insertRecordAsync(this.tableName, key, trialParticipant);

    findBy = (trialKey, trialParticipant, callback) => this.StorageService.getRecord(this.tableName, key, callback);

    findAll = (callback) => this.StorageService.getAllRecords(this.tableName, callback);

    findAllAsync = async () => this.StorageService.getAllRecordsAsync(this.tableName);

}

export default {
    getInstance: (DSUStorage) => {
        if (typeof window.trialParticipantRepositoryInstance === "undefined") {
            window.trialParticipantRepositoryInstance = new TrialParticipantRepository(DSUStorage);
        }
        return window.trialParticipantRepositoryInstance;
    }
}
