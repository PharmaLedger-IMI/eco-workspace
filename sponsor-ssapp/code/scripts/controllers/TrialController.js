import ContainerController from '../../../cardinal/controllers/base-controllers/ContainerController.js';

export default class TrialController extends ContainerController {
  constructor(element, history) {
    super(element, history);
    this.setModel({
      id: null,
    });
    let trialId = this.History.getState();

    this.model.id = trialId;

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
