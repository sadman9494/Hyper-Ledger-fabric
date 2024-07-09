const mongoose = require("mongoose");
const dotenv = require("dotenv");


dotenv.config();

const dbString = process.env.DB_STRING; 
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
    mongoose.connect(dbString, clientOptions)
     .then(() => {
        return mongoose.connection.db.admin().command({ ping: 1 });
      })
     .then(() => {
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
      })
     .catch((err) => {
        console.error(err);
      });
  }

run().catch(console.dir);

module.exports = run;
