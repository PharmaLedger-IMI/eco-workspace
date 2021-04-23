import NotificationsService from "./services/NotificationsService.js";
const {WebcController} = WebCardinal.controllers;

export default class NotificationsController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({notifications:[]});

        this.NotificationsService = new NotificationsService(this.DSUStorage);
        this.NotificationsService.getNotifications((err, data) => {
            if (err) {
                return console.log(err);
            }
            console.log("All Notifications " + data);
            this.model.notifications = data.notifications;
        });
    }

    getNotifications (){
        debugger;
    }
}