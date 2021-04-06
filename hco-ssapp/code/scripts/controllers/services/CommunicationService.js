const opendsu = require("opendsu");
const w3cDID = opendsu.loadAPI('w3cdid');

export default class CommunicationService {


    constructor() {
        w3cDID.createIdentity("demo", "myfirstDemoIdentity", (err, firstDIDDocument) => {
            if (err) {
                throw err;
            }
            const recipientIdentity = firstDIDDocument.getIdentifier();
            console.log ("IDENTITY created , is waiting for messages");
            firstDIDDocument.readMessage((err, msg) => {
                if(err){
                    throw err;
                }

                console.log(`${recipientIdentity} received messag from sponsor : ${msg}`);
            });

        });

    }

}