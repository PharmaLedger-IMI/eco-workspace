import NotificationsRepository from "../repositories/NotificationsRepository.js";
const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        notifications: [],
        notType: ''
    };
};

export default class NotificationsListController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this.model.notificationType = this.history.win.history.state.state.notType;
        this._initServices(this.DSUStorage);
        this._initNotifications();
    }

    _initServices(DSUStorage) {
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
    }

    _initNotifications() {

        this.NotificationsRepository.findAll((err, data) => {
            debugger;
            if (err) {
                return console.log(err);
            }
            this.model.notifications = data;
            //data.filter(not =>  not.notificationType === this.model.notificationType )

          });
    }
}
