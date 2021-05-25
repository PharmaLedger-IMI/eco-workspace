const { WebcController } = WebCardinal.controllers;
import NotificationsService from '../services/NotificationsService.js';

let getInitModel = () => {
  return {
    notifications: [],
  };
};

export default class NotificationsController extends WebcController {
  constructor(...props) {
    super(...props);
    this.setModel(getInitModel());

    this._initServices(this.DSUStorage);
    this._initNotifications();
  }

  _initServices(DSUStorage) {
    this.NotificationsService = new NotificationsService(DSUStorage);
  }

  _initNotifications() {
    this.NotificationsService.getNotifications((err, data) => {
      if (err) {
        return console.log(err);
      }
      this.model.notifications = data;
    });
  }
}
