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
    male = {
        label: 'Male',
        name: 'male',
        required: false,
        value: 'false',
    }
    female = {
        label: 'Female',
        name: 'female',
        required: false,
        value: 'true',
    }

    constructor(element, history) {
        super(element, history);


        debugger;
        this.setModel({
            tp: {

                number: this.number,
                birthdate: this.birthdate,
                sex: 'female',
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
            const tp = {
                number: this.model.tp.number.value,
                birthdate: this.model.tp.birthdate.value,
                sex: this.model.sex,

            };
            this.send('confirmed', tp);

            }
        )
    }

}
