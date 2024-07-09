const connect_gateway = require('./fabric_connection')
const utf8Decoder = new TextDecoder()
const channelName = 'mychannel';
const chaincodeName = 'basic';
/**
 * @param {string} tacking_id The date
 * @param {string} student_name The string
 * @param {string} student_id The string
 * @param {string} student_email The string
 * @param {string} degree The string
 * @param {string} major The string
 * @param {float} result The string
 */
async function submit_request(tracking_id,student_name,student_id,student_email,degree,major,result,cert,tlsCert,keyPath){
    student_id = parseInt(student_id)
    result = parseFloat(result).toFixed(2)



    const {gateway,client} = await connect_gateway(cert,tlsCert,keyPath)
     
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.submitTransaction('RequestIssueCertificate',
                tracking_id,
                student_name,
                student_id.toString(),
                student_email.toString(),
                degree,
                major,
                result.toString()
            )
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {
            if (error) {
                console.log(error)
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()

            client.close()
        }

}

/**
 * @param {string} tacking_id The tracking with one check a request
 */
async function read_request(tracking_id){
    tracking_id = parseInt(tracking_id)

    const {gateway,client} = await connect_gateway()
     
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.evaluateTransaction('ReadRequest',
                tracking_id.toString()
            )
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {
            if (error) {
                console.log(error)
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()
            client.close()
        }
}

async function get_all_request(cert, tlsCert, keyPath){
    const {gateway,client} = await connect_gateway(cert, tlsCert,keyPath)
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.evaluateTransaction('GetAllTheRequests')
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {
            if (error) {
                console.log(error)
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()

            client.close()
        }

}

async function read_certificate_by_certid(certificate_id){
    certificate_id = parseInt(certificate_id)
    const {gateway,client} = await connect_gateway()
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.evaluateTransaction('ReadCertificateByCertificateId', certificate_id.toString())
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {
            if (error) {
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()

            client.close()
        }
}

async function history_of_a_request(tracking_id){
    tracking_id = parseInt(tracking_id)
    const {gateway,client} = await connect_gateway()
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.evaluateTransaction('HistoryOfRequest', tracking_id.toString())
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {
            if (error) {
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()

            client.close()
        }
}


async function verify_by_hash(hash) {
    const {gateway,client} = await connect_gateway()
        try {
            const network = await gateway.getNetwork(channelName)
            const contract = await network.getContract(chaincodeName)
            let trx = await contract.evaluateTransaction('VerifyCertificateByCertificateHash', hash.toString())
            trx = utf8Decoder.decode(trx)
            return trx
        } catch (error) {

            if (error) {
                return "Something Went Wrong"
            }
        } finally {
            gateway.close()

            client.close()
        }

}

module.exports={
    submit_request,
    read_request,
    get_all_request,
    history_of_a_request,
    read_certificate_by_certid,
    verify_by_hash
}