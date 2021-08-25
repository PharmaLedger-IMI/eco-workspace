const {WebcController} = WebCardinal.controllers;


export default class VisitAcceptOrDeclineController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});

        this.onTagEvent('visit:accept', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', {accepted: true});
        });

        this.onTagEvent('visit:reject', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', {accepted: false});
        });
    }
}
