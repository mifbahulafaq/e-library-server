const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    serviceName : process.env.SERVICE_NAME,
    rootPath: path.resolve(__dirname,'..'),
	secretKey: process.env.SECRET_KEY,
	imageSize: 300000,
	fine:2000,
	fineTime:86400000,

    //DATABASE
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    dbAuthSource:process.env.DB_AUTH_SOURCE
}