
const {WebcController} = WebCardinal.controllers;

export default class ReadEconsentController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            econsent: {

                name: "econsent",
                required: true,
                value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
            },
            error: {
                name: "error",
                value: ''
            }
        })

        this.signEconsent();
        this.readEconsent("/assets/econsent.txt")

    }

    readEconsent(file){
            // read text from URL location
            var request = new XMLHttpRequest();
            request.open('GET', 'https://filesamples.com/samples/document/txt/sample3.txt', true);
            request.send(null);
            debugger
            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status === 200) {
                    var type = request.getResponseHeader('Content-Type');
                    if (type.indexOf("text") !== 1) {
                        debugger
                        return request.responseText;
                        console.log(request.responseText);
                        console.log(request.response);
                    }
                }
            }

    }
    signEconsent() {
        this.on('econsent:sign', (event) => {

            console.log('withdraw')
            this._finishProcess(event, {
                signed: true,
            });
        });
    }

    _finishProcess(event, response) {
        event.stopImmediatePropagation();
        this.responseCallback(undefined, response);
    };


}
