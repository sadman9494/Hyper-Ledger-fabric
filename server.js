const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const validator = require('validator')
const cors = require('cors')
const contract = require('./contract.js')
const run = require('./dbConnect.js')
const dbSchema = require('./schema.js')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const decode = require('./middleware.js')
const userModel = new mongoose.model('user', dbSchema)
const app = express()
const port = 9001

let corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

dotenv.config()
app.use(bodyParser.json())
app.use(cors(corsOptions))

run();

app.post('/create-user', async (req, res) => {
    try {
        const { userName, email, password, organisation } = req.body;

                     const tlsCert = organisation === 'org2.example.com'
                     ? path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt')
                     : path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
                 
                 const keyPath = organisation === 'org2.example.com'
                     ? path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'keystore', 'priv_sk')
                     : path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'keystore', 'priv_sk');
                 
                 const cert = organisation === 'org2.example.com'
                     ? path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem')
                     : path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
                 
        const user = new userModel(
        {
          userName,
          email,
          password,
          organisation,
          tlsCert,
          keyPath,
          cert
        }
       );
      
        await user.save();
        res.status(200).send({ message: "user is successfully created" });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.body.email, organisation: req.body.organisation });
        if (!user || user.password != req.body.password) {
            res.status(404).json({ data: "invalid user" });
        }
        else {
            const token = jwt.sign(
            {
              email: user.email,
              id: user._id,
              userName: user.userName,
              organisation: user.organisation }, 
              process.env.JWT_HASH, {
                expiresIn: '1h'
            });
            res.status(200).json({
                "Access_Token": token,
                "data": "valid user"
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Internal server error" });
    }
})

app.get('/users',decode, async (req, res) => {
    try {
        const appl = req.id;
        const tls = req.tlsCert;
        const key = req.keyPath;
        const cert = req.cert;

        const users = await userModel.find().exec();
        if (users.length > 0) {
            res.status(201).json({
                data: users,
            })
            console.log (appl);
            console.log (tls);
            console.log (key);
            console.log (cert);
        }
        else {
            res.status(404).json({ data: "No users found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ data: "internal server error" })
    }
})


app.post('/issue-certificate', cors(corsOptions),decode,async(req,res)=>{

    const org = req.organisation
    if(!req.body.tracking_id){
        return res.status(400).json({data:"Fileds Are Missing"})
    }

    let cert_hash  = crypto.createHash('sha256')
    let cert_id = Math.floor(Math.random() * 12562) * Math.floor(Math.random() * 25641);
    let track_id = req.body.tracking_id;
    let student_name,student_email;

    try {

        request = await contract.read_request(track_id.toString(),org)
        request = JSON.parse(request)
        student_name = request.Student_Name
        student_email = request.Student_Email
        let newRequest = JSON.stringify(request)
        cert_hash = cert_hash.update(`${newRequest.Student_Name},${newRequest.Student_Id},${newRequest.Student_Email},${newRequest.Degree},${newRequest.Major},${newRequest.Result},${newRequest.Requester_Authority},${cert_id}`);
        cert_hash = cert_hash.digest('hex')
 
       
    } catch(error) {
        if (error){
            console.log(error)
            return res.status(500).json({data:`No data found for  id ${track_id}`})
        }
    }

    try {
       
        let result = await contract.issue_certificate(track_id.toString(),cert_hash,cert_id.toString(), org)
        if (parseInt(result) === 0 ){
            return res.status(200).json({data: `Certificate Already Created For The Tracking Id ${track_id}`})
        }
        if( result === "Something Went Wrong"){
            return res.status(500).json({data:"Failed To Connect The Blokchain Network"})
        }
        let emailStatus = await sendEmail(student_name,cert_id,student_email)
        if (emailStatus === false) {

            return res.status(500).json({data:`Certificate Created With The Certificate Id ${result}. But Email Was not Sent`})
            
        }
        return res.status(201).json({data: `Certificate Created With The Certificate Id ${result}`})
    } catch (error) {
        if (error){
            console.log(error)
            return res.status(500).json({data:`No data found for  id ${track_id}`})
        }
    }
})

app.post('/submit-request',cors(corsOptions),decode, async (req , res)=> {
   
    const org = req.organisation

    if( !req.body.student_name || !req.body.student_id || 
        !req.body.student_email || !req.body.degree || !req.body.major || !req.body.result ){

        return res.status(400).json({data:"Missing required fields"})
    }
    if(! validator.isEmail(req.body.student_email)){
        return res.status(400).json({data:"Invalid Email Address"})
    }
    let track_id
    try {
        let requests = await contract.get_all_request(org)
        
        if(requests === "Something Went Wrong"){
            
            return res.status(500).json({data:"Failed To Connect The Blokchain Network"})
        }

        if (!requests){
            track_id = 1;
        } else {
            requests = JSON.parse(requests)
            track_id = requests.length + 1;
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({data:"Failed To Connect The Blokchain Network"})
    }


        
    try{
       
        const response = await contract.submit_request(track_id.toString(),req.body.student_name,
        req.body.student_id, req.body.student_email,req.body.degree ,req.body.major,req.body.result,org)
        return res.status(200).json({data:JSON.parse(response)});

    }catch(err){
        console.log(err)
        return res.status(500).json({data:"Failed To Connect The Blokchain Network"})
    }
        
})

app.get('/read-request/:tracking_id',decode,async (req,res)=>{

    const track_id = req.params.tracking_id
    const org = req.organisation
    if(!track_id){
        return res.status(400).json({data:"Invlaid Path"})
    }
    try {
        let request_history =  await contract.read_request(track_id.toString() ,org )
        return res.status(200).json({data:JSON.parse(request_history)})
    } catch (error) {
        if (error) {
            return res.status(500).json({data:`No data found for  id ${track_id}`})
        }
    }
})


app.post('/read-request',decode,async (req,res)=>{

    const track_id = req.body.tracking_id
    const org = req.organisation
    if(!track_id){
        return res.status(400).json({data:"Missing Required Tracking Id"})
    }
    try {
        let request_history =  await contract.read_request(track_id.toString(),org)
        return res.status(200).json({data:JSON.parse(request_history)})
    } catch (error) {
        if (error) {
            return res.status(500).json({data:`No data found for  id ${track_id}`})
        }
    }
})

app.get('/get-all-the-request', cors(corsOptions),decode, async(req,res)=>{

    try {

        const org = req.organisation
        const result = await contract.get_all_request(org)
        
        if (!result || result.trim() === '') {
            throw new Error('Empty result received from get_all_request');
        }

        console.log('result',result);
        let requests = JSON.parse(result)
        requests.forEach(request =>{
            if(request.Is_Reqeust_Completed){
                request.Requester_Authority = "Dhaka College"
                request.Issuer_Authority = "Dhaka Univertsity"
            } else {
                request.Requester_Authority = "Dhaka College"
            }
        })
        return res.status(200).json({data:requests})
    } catch (error) {
        console.log(error)
        return res.status(500).json({data:"Failed To Connect The Blokchain Network"})
    }
})


app.post('/read-certificate-by-id',decode,async(req,res)=>{

    let cert_id = req.body.certificate_id
    const org = req.organisation

    if(!cert_id){
        return res.status(400).json({data:"Required Certificate Id Is Missing"})
    }

    try {
        const certificate = await contract.read_certificate_by_certid(cert_id.toString(),org)
        let cert = JSON.parse(certificate);
        cert.Requester_Authority = "Dhaka College";
        cert.Issuer_Authority = "Dhaka University";
        return res.status(200).json({data:cert})
    } catch (error) {
        if (error) {
            return res.status(500).json({data:`Certificate Not Found For The Id ${cert_id}`})
        }
    }
})


app.post('/history-of-certificate',decode,async (req,res)=>{

    let tracking_id = req.body.tracking_id
    const org = req.organisation
    if(!tracking_id){
        return res.status(400).json({data:"Required Fields Tracking_Id  Is  Missing"})
    }

    try {
        let request_history =  await contract.history_of_a_request(tracking_id.toString(), org)
        let requests = JSON.parse(request_history)
        requests.forEach(request =>{
            if(request.Is_Reqeust_Completed){
                request.Requester_Authority = "Dhaka College"
                request.Issuer_Authority = "Dhaka Univertsity"
            } else {
                request.Requester_Authority = "Dhaka College"
            }
        })
        
        return res.status(200).json({data:requests})

    } catch (error) {
        if (error) {
            return res.status(500).json({data:`Certficate History Is Not Found For The Tracking Id : ${tracking_id}`})
        }
    }
})

app.post('/verify-by-hash', decode,async(req,res)=>{

    const org = req.organisation
    let certificate_hash = req.body.certificate_hash
    if(!certificate_hash){
        return res.status(400).json({data:"Required Certificate Hash Is Missing"})
    }
    try {
        let result = await contract.verify_by_hash(certificate_hash.toString(),org)
        let cert = JSON.parse(result);
        cert.Requester_Authority = "Dhaka College";
        cert.Issuer_Authority = "Dhaka University";
        return res.status(200).json({data:cert})
    } catch (error) {

        if (error) {
            return res.status(500).json({data:`Certificate Not Found For The Hash ${certificate_hash}`})
        }
    }
})


app.get('/read-certificate-by-id/:certificate_id', cors(corsOptions),decode, async(req,res)=>{

    let cert_id = req.params.certificate_id
    const org = req.organisation

    

    try {
        const certificate = await contract.read_certificate_by_certid(cert_id.toString(), org)
        let cert = JSON.parse(certificate);
        cert.Requester_Authority = "Dhaka College"
        cert.Issuer_Authority = "Dhaka University"
        return res.status(200).json({data:cert})
    } catch (error) {
        if (error) {
            return res.status(500).json({data:`Certificate Not Found For The Id ${cert_id}`})
        }
    }
})

app.get('/history-of-certificate/:tracking_id', cors(corsOptions),decode,async (req,res)=>{

    let tracking_id = req.params.tracking_id
    const org = req.organisation
    if(!tracking_id){
        return res.status(400).json({data:"Required Fields Tracking_Id  Is  Missing"})
    }

    try {
        let request_history =  await contract.history_of_a_request(tracking_id.toString(),org)
        let requests = JSON.parse(request_history)
        requests.forEach(request =>{
            if(request.Is_Reqeust_Completed){
                request.Requester_Authority = "Dhaka College"
                request.Issuer_Authority = "Dhaka Univertsity"
            } else {
                request.Requester_Authority = "Dhaka College"
            }
        })
        
        return res.status(200).json({data:requests})

    } catch (error) {
        if (error) {
            return res.status(500).json({data:`Certficate History Is Not Found For The Tracking Id : ${tracking_id}`})
        }
    }
})

app.listen(port,() => {
    console.log(`Server is running on port ${port}`);
});

