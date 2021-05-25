const { WebcController } = WebCardinal.controllers;
export default class WithdrawEconsent extends WebcController {
  constructor(...props) {
    super(...props);
    this.setModel({});
    this._initHandlers();
  }

  _initHandlers() {
    this._attachHandlerCancel();
    this._attachHandlerWithdraw();
    this._attachHandlerWithdrawIntention();
  }

  _attachHandlerWithdraw() {
    this.onTagEvent('withdraw-on-click', 'click', (model, target, event) => {
      this.send('confirmed', {
        withdraw: true,
      });
    });
  }

  _attachHandlerWithdrawIntention() {
    this.onTagEvent('withdraw-intention-on-click', 'click', (model, target, event) => {
      this.send('confirmed', {
        withdrawIntention: true,
      });
    });
  }

  _attachHandlerCancel() {
    this.onTagEvent('cancel', 'click', (model, target, event) => {
      this.send('closed', {
        withdraw: false,
      });
    });
  }

  _finishProcess(event, response) {
    event.stopImmediatePropagation();
    this.responseCallback(undefined, response);
  }
}
