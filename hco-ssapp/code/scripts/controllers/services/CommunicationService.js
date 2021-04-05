const opendsu = require("opendsu");
const w3cDID = opendsu.loadAPI('w3cdid');

export default class CommunicationService {


    constructor() {
        w3cDID.createIdentity("demo", "myfirstDemoIdentity", (err, firstDIDDocument) => {
            if (err) {
                throw err;
            }

            firstDIDDocument.readMessage((err, msg) => {
                if(err){
                    throw err;
                }

                console.log(`${recipientIdentity} received message: ${msg}`);
            });

            const recipientIdentity = firstDIDDocument.getIdentifier();
            w3cDID.createIdentity("demo", "otherDemoIdentity", (err, secondDIDDocument) => {
                if (err) {
                    throw err;
                }

                const senderIdentity = firstDIDDocument.getIdentifier();
                setTimeout(()=>{
                    let message = "Hello from another part of the world.";
                    secondDIDDocument.sendMessage(message, recipientIdentity, (err) => {
                        if(err){
                            throw err;
                        }
                        console.log(`${senderIdentity} sent message to ${recipientIdentity}.`);
                    });
                }, 1000);

            });
        });

    }

}