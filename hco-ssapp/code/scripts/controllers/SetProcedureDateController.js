const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        procedureDate: {
            label: 'Procedure date',
            name: 'procedureDate',
            required: true,
            placeholder: 'Please set the date ',
            value: '',
        },

    };
};

export default class SetProcedureDateController extends WebcController {
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
            this.send('confirmed', this.model.procedureDate.value);
        });
    }
}
