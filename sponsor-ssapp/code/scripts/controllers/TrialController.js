// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class TrialController extends WebcController {
  constructor(...props) {
    super(...props);

    this.setModel({
      id: null,
    });

    let { id } = this.history.location.state;

    this.model.id = id;

    this.attachEvents();

    this.init();
  }

  async init() {
    return;
  }

  attachEvents() {
    return;
  }
}
