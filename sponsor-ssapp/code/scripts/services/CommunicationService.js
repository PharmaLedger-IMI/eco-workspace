const opendsu = require("opendsu");
const w3cDID = opendsu.loadAPI('w3cdid');

export default class CommunicationService {


    sendMessage(message) {

        const recipientIdentity = "did:demo:myfirstDemoIdentity";
        w3cDID.createIdentity("demo", "otherDemoIdentity", (err, secondDIDDocument) => {
            if (err) {
                throw err;
            }

            const senderIdentity = secondDIDDocument.getIdentifier();
            setTimeout(() => {

                secondDIDDocument.sendMessage(message, recipientIdentity, (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${senderIdentity} SPONSOR SSAPP sent message to ${recipientIdentity}.`);
                });
            }, 1000);

        });
    }


}