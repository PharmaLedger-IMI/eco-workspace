const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        startDate: {
            label: 'Start date',
            name: 'startDate',
            required: true,
            placeholder: 'Please set the start date ',
            value: '',
        },
        endDate: {
            label: 'End date',
            name: 'endDate',
            required: true,
            placeholder: 'Please set the end recruitment date ',
            value: '',
        }

    };
};

export default class EditRecruitmentPeriodController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel(getInitModel());
        this._initHandlers();
        this.model.recruitmentPeriod = props[0].recruitmentPeriod;
        if (this.model.recruitmentPeriod){
            this.model.startDate.value= this.model.recruitmentPeriod.startDate;
            this.model.endDate.value= this.model.recruitmentPeriod.endDate;
        }
    }

    _initHandlers() {
        this._attachHandlerSubmit();
    }

    _attachHandlerSubmit() {
        this.onTagEvent('tp:submit', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.send('confirmed', {startDate: this.model.startDate.value, endDate: this.model.endDate.value});
            this.send('confirmed', {startDate: this.model.startDate.value, endDate: this.model.endDate.value});
        });
    }
}
