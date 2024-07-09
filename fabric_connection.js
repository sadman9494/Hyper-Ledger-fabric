const path = require('path');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('crypto');
const fs = require('fs').promises;
const { TextDecoder } = require('node:util');
const channelName = 'mychannel';
const chaincodeName = 'basic';

const utf8Decoder = new TextDecoder()
/*
const cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com');

const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
const keyPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'keystore', 'priv_sk');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem');
*/
async function connect_gateway(org) {
    
   const organisation = org;
   let cryptoPath;
   let tlsCertPath;
   let keyPath;
   let certPath;
   let mspId;
   let localhost;

   if(organisation == "org2.example.com")
    {
        cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com');
        mspId = 'Org2MSP'
        tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
        keyPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'keystore', 'priv_sk');
        certPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem');
        localhost = 'localhost:9051';
    }
   else{
        cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
        mspId = 'Org1MSP'
        tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
        keyPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore', 'priv_sk');
        certPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
        localhost = 'localhost:7051';
    }

    console.log('Connecting to organization:', organisation);
    console.log('MSP ID:', mspId);
    //console.log(keyPath);
    //console.log(tls);
    //console.log('connection getway',tls)
    const tlsCert = await fs.readFile(tlsCertPath);
    const key = await fs.readFile(keyPath);
    const cert = await fs.readFile(certPath);

    const client = new grpc.Client(localhost, grpc.credentials.createSsl(tlsCert));

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
