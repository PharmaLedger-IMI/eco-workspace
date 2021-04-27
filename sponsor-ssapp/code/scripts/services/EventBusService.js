class EventBusService {
  eventTopics = {};

  constructor() {}

  addEventListener = function (eventName, listener) {
    if (!this.eventTopics[eventName] || this.eventTopics[eventName].length < 1) {
      this.eventTopics[eventName] = [];
    }
    this.eventTopics[eventName].push(listener);
  };

  emitEventListeners = function (eventName, params) {
    if (!this.eventTopics[eventName] || this.eventTopics[eventName].length < 1) return;
    this.eventTopics[eventName].forEach(function (listener) {
      listener(params ? params : {});
    });
  };
}

const eventBusService = new EventBusService();

export default eventBusService;
