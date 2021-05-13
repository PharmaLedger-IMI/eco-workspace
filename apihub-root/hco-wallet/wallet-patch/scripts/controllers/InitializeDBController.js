import ContainerController from "../../cardinal/controllers/base-controllers/ContainerController.js";

export default class InitializeDBController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        debugger;
        this.DSUStorage.call("createSSIAndMount", "/apps/hco-ssapp/sharedDB", (err, res) => {
            console.log(err, res);
        })

    }
}