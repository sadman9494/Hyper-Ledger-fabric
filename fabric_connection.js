const path = require('path');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('crypto');
const fs = require('fs').promises;
const { TextDecoder } = require('node:util');
const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspId = 'Org2MSP';
const utf8Decoder = new TextDecoder()

const cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com');

const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
const keyPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'keystore', 'priv_sk');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem');

async function connect_gateway(certificate,tls,keyPath) {
    
    //console.log(certificate);
    //console.log(keyPath);
    //console.log(tls);

    const tlsCert = await fs.readFile(tls);
    const key = await fs.readFile(keyPath);
    const cert = await fs.readFile(certificate);

    const client = new grpc.Client('localhost:9051', grpc.credentials.createSsl(tlsCert));

    const gateway = connect({
        client,
        identity: {
            mspId,
            credentials: cert
        },
        signer: signers.newPrivateKeySigner(crypto.createPrivateKey(key))
    });

    return {client,gateway};
}


module.exports =connect_gateway;
