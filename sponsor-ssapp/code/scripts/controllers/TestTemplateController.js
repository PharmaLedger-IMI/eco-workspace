// eslint-disable-next-line no-undef
const { WebcController } = WebCardinal.controllers;

export default class TestTemplateController extends WebcController {
  constructor(element, history) {
    super(element, history);

    this.attachEvents();

    console.log(this);
    this.init();
  }

  async init() {
    // const model = await this.getModel();
    console.log('THIS IS THE MODEL:', this.model);
    return;
  }

  attachEvents() {
    return;
  }
}
