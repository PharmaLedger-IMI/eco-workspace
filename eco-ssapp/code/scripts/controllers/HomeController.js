import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';

export default class HomeController extends ContainerController {
  constructor(...props) {
    super(...props);
    this._attachHandlerCreateTrial();
    this._attachHandlerClinics();
  }

  _attachHandlerCreateTrial() {
    this.on('home:trial', (event) => {
      console.log('Button pressed');
      this.History.navigateToPageByTag('create-trial');
    });
  }

  _attachHandlerClinics() {
    this.on('home:clinics', (event) => {
      console.log('Button 2 pressed');
    });
  }
}
