const getToken = require('../utils/get-token');
const jwt = require('jsonwebtoken');
const User = require('../user/model');
const config = require('../config');

async function decodeToken(req,res,next){
	try{
			
		const token = getToken(req);
			
		if(!token) return next();
			
		const user = await User.findOne({token: {$in: [token]}});
		
		if(!user){
			return res.json({
				error: 1,
				message: 'token expired'
			})
		}
			
		req.user = jwt.verify(token,config.secretKey);
		next();
	}catch(err){
		if(err && err.name == 'JsonWebTokenError'){
			return res.json({
				error: 1,
				message: err.message
			})
		}
		next(err)
	}
}

module.exports = {
	decodeToken
}