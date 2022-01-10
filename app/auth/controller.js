const User = require('../user/model');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const getToken = require('../utils/get-token');

async function localStrategy(username, password, done){
	try{
		const user = await User
		.findOne({email: username})
		.select('-token -__v');
		
		if(user){
			
			if(bcrypt.compareSync(password, user.password)){
				
				({password, ...userWithoutPassword} = user.toJSON());
				
				return done(null,userWithoutPassword)
			}
			
		}
		
		return done(null,false,{message: 'Incorrect email or password'});
		
	}catch(err){
		
		if(err) return done(err,null);
	}
}

async function login(req,res,next){
	
	passport.authenticate('local', async function(err,user,info){
		
		if(err) return next(err);
		if(!user){
			
			return res.json({
				error: 1,
				message: info.message
			})
		}
		
		try{
			
			const token = jwt.sign(user,config.secretKey);
			
			await User.findOneAndUpdate({_id: user._id},{$push: {token: token}});
			
			return res.json({
				message: 'Logged in succcessfully',
				user: user,
				token: token
			})
			
		}catch(err){
			
			throw err;
			
		}
	})(req,res,next)

}

async function logout(req,res,next){
    try{
		const token = getToken(req);
		const user = await User.findOne({token: {$in: [token]}},{$pull:{token}});
		
		if(!token || !user){
			return res.json({
				error: 1,
				message: 'no user found'
			})
		}
		
		return res.json({
			err: 0,
			message: 'Logged out succcessfully'
		})
    }catch(err){
        next(err)
    }

}

function me(req,res,next){
	if(!req.user){
		res.json({
			error:1,
			message: `you'r not login or token expired`
		})
	}
	return res.json(req.user);
}

module.exports = {
    login,
    logout,
	me,
	localStrategy
}