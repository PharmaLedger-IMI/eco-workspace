const controllerRegistry = require("./controllers/ControllersRegistry").getControllersRegistry();

module.exports = {
    CommunicationService: require("./services/CommunicationService"),
    DateTimeService: require("./services/DateTimeService"),
    DIDService : require ("./services/DIDService"),
    DSUService : require ("./services/DSUService"),
    SharedStorage: require ("./services/SharedStorage"),
    BaseRepository: require ("./services/BaseRepository"),
    Constants : require ("./utils/Constants"),
    FileDownloader : require ("./utils/FileDownloader"),

    getController: function (controllerName) {
        return controllerRegistry.getControllerClass(controllerName);
    }
}