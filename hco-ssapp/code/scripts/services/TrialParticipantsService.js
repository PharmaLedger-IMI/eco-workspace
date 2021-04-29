import DSUService from "./DSUService.js";

export default class TrialParticipantsService extends DSUService {

    constructor(DSUStorage) {
        super(DSUStorage, '/tps');
    }

    getTrialParticipants = (trialSSI, callback) => this.getEntities(callback, this._getTrialParticipantsPath(trialSSI))

    saveTrialParticipant = (trialSSI, trialParticipant, callback) => this.saveEntity(trialParticipant, callback, this._getTrialParticipantsPath(trialSSI));

    _getTrialParticipantsPath = (keySSI) => this.PATH + '/' + keySSI;
}