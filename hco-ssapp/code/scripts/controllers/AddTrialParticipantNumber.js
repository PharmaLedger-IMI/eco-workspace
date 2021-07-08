const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        number: {
            label: 'Trial Subject Number',
            name: 'number',
            required: true,
            placeholder: 'Please insert the trial subject number...',
            value: '',
        },
    };
};

export default class AddTrialParticipantNumber extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this._initHandlers();
    }

    _initHandlers() {
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', this.model.number.value);
        });
    }
}
