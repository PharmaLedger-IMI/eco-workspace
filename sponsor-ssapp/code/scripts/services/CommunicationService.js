const opendsu = require("opendsu");
const w3cDID = opendsu.loadAPI('w3cdid');

export default class CommunicationService {

    DEFAULT_FORMAT_IDENTIFIER = "did";
    DEMO_METHOD_NAME = "demo";

    static SPONSOR_IDENTITY = "sponsorIdentity";
    static HCO_IDENTITY = "hcoIdentity";

    constructor(identity) {
        w3cDID.createIdentity(this.DEMO_METHOD_NAME, identity, (err, didDocument) => {
            if (err) {
                throw err;
            }
            this.didDocument = didDocument;
            console.log(`Identity ${didDocument.getIdentifier()} created successfully.`)
        });
    }

    readMessage(callback) {
        this.didDocument.readMessage((err, msg) => {
            if(err){
                return callback(err);
            }
            console.log(`${this.didDocument.getIdentifier()} received message: ${msg}`);
            callback(err, msg);
        });
    }

    sendMessage(destinationIdentity, message) {
        const recipientIdentity = this.DEFAULT_FORMAT_IDENTIFIER + ':' + this.DEMO_METHOD_NAME + ':' + destinationIdentity;
        this.didDocument.sendMessage(message, recipientIdentity, (err) => {
            if (err) {
                throw err;
            }
            console.log(`${this.didDocument.getIdentifier()} sent a message to ${recipientIdentity}.`);
        });
    }

}