class EventBusService {
  eventTopics = {};

  constructor() {}

  addEventListener = function (eventName, listener) {
    console.log('EVENT TOPICS:', this.eventTopics);

    if (!this.eventTopics[eventName] || this.eventTopics[eventName].length < 1) {
      this.eventTopics[eventName] = [];
    }

    if (!this.eventTopics[eventName].map((x) => x.toString()).includes(listener.toString())) {
      this.eventTopics[eventName].push(listener);
    }
  };

  emitEventListeners = function (eventName, params) {
    console.log('EVENT TOPICS:', this.eventTopics);
    if (!this.eventTopics[eventName] || this.eventTopics[eventName].length < 1) return;
    this.eventTopics[eventName].forEach(function (listener) {
      listener(params ? params : {});
    });
  };
}

const eventBusService = new EventBusService();

export default eventBusService;
