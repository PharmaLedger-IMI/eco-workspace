const {WebcController} = WebCardinal.controllers;

export default class ProceduresViewController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({
            ...this.history.win.history.state.state,
        });
    }


}
