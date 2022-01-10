const mongoose = require("mongoose");
const {dbUser,dbPort,dbPass,dbName,dbHost,dbAuthSource} = require("../app/config");
mongoose
.connect(`mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?authSource=${dbAuthSource}`)
.catch(err=>console.log('the error of initial connection is ' + err));

const db = mongoose.connection;
module.exports = db;