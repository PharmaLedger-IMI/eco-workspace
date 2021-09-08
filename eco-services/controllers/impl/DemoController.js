const {WebcController} = WebCardinal.controllers;

class DemoController extends WebcController {
    constructor(...props) {
        super(...props);
    }
}

const controllersRegistry = require('../ControllersRegistry').getControllersRegistry();
controllersRegistry.registerController('DemoController', DemoController);