const {WebcController} = WebCardinal.controllers;


export default class AddTrialParticipantController extends WebcController {

    number = {
        label: 'Trial Participant Number',
        name: 'number',
        required: true,
        placeholder: 'Please insert the trial participant number...',
        value: '',
    };

    birthdate = {
        label: 'Trial Number/ID',
        name: 'id',
        required: true,
        value: '',
    };

    sex = {
        label: 'Sex',
        name: 'sex',
        required: true,
        value: '',
    }

    constructor(element, history) {
        super(element, history);


        debugger;
        this.setModel({
            tp: {

                number: this.number,
                birthdate: this.birthdate,
                sex: this.sex,
            },

        });
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {

        debugger;
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger;
                console.log(this.model.tp.birthdate.value);

            }
        )
    }

}
