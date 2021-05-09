
const {WebcController} = WebCardinal.controllers;
export default class SiteController  extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({});
        this._initSite ();
    }

    _initSite (){
        this.model.site = {name:'Test Site', address: 'A lorem ipsum test', phone: '0078453295',email:'test@site.com'}
    }
}