const jwt = require ('jsonwebtoken')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const validator = require('validator')
const cors = require('cors')
const contract = require('./contract.js')
const run = require('./dbConnect.js')
const dbSchema = require('./schema.js')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const decode = require('./middleware.js')
const userModel = new mongoose.model('user', dbSchema)

const verifyLogin = async(req, res,next)=>
{
  const {authorization} = req.headers;
  if (!authorization) {
    return res.status(401).send('Authorization header missing');
}
  try{
    
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_HASH);
    req.userName = decoded.userName;
    req.id = decoded.id;
    req.organisation = decoded.organisation;
    req.email = decoded.email;

    // fetching the cert credentials for the users 
    const details = await userModel.findOne({_id: req.id});
    req.tlsCert = details.tlsCert;
    req.keyPath = details.keyPath;
    req.cert = details.cert;
    console.log(req.tlsCert);
    next();
  } catch(err)
  {
    console.error(err);
    res.status(401).send('Authentication failed')
  }
}

module.exports = verifyLogin;