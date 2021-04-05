require("../../../../psknode/bundles/testsRuntime");

const tir = require("../../../../psknode/tests/util/tir");
const dc = require("double-check");
const assert = dc.assert;

const w3cDID = require('../../w3cdid');
const keySSI = require("../../keyssi")


assert.callback('w3cDID MQ test', (testFinished) => {
    const message = "Hello DID based MQs!";
    tir.launchVirtualMQNode(function (err, port) {
        if (err) {
            throw err;
        }

        w3cDID.createIdentity("demo", "myfirstDemoIdentity", (err, firstDIDDocument) => {
            if (err) {
                throw err;
            }

            firstDIDDocument.readMessage((err, msg) => {
                if (err) {
                    throw err;
                }

                console.log(`${recipientIdentity} received message: ${msg}`);
                assert.equal(msg, message);
                testFinished();
            });

            const recipientIdentity = firstDIDDocument.getIdentifier();
            w3cDID.createIdentity("demo", "otherDemoIdentity", (err, secondDIDDocument) => {
                if (err) {
                    throw err;
                }

                const senderIdentity = firstDIDDocument.getIdentifier();
                setTimeout(() => {
                    secondDIDDocument.sendMessage(message, recipientIdentity, (err) => {
                        if (err) {
                            throw err;
                        }
                        console.log(`${senderIdentity} sent message to ${recipientIdentity}.`);
                    });
                }, 1000);

            });
        });
    });

}, 15000);

assert.callback('w3cDID resolver test', (testFinished) => {
    const domain = 'default';

    w3cDID.createIdentity("sReadPK", keySSI.createTemplateSeedSSI(domain), (err, didDocument) => {
        if (err) {
            throw err;
        }

        w3cDID.resolveDID(didDocument.getIdentifier(), (err, didDocument) => {
            if (err) {
                throw err;
            }
            debugger

            didDocument.sendMessage("The DID Sent a message : HI! ")

        });


    });
}, 5000);

