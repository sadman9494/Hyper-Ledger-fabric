const mongoose = require("mongoose");

const dbSchema = mongoose.Schema({
    userName : String,
    email : String,
    password : String,
    organisation : String,
    tlsCert : String,
    keyPath : String,
    cert : String
});

module.exports = dbSchema;