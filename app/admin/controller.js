const User = require('../user/model');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function update(req,res,next){
	
			let policy = policyFor(req.user);
			
			let payload = req.body;
			
			try{
				
				let user = await User.findOne({_id: req.params.id});
				
				const subjectAdmin = subject('Admin',{...user, user_id: user._id})
				
				if(!policy.can('edit',subjectAdmin)){

					return res.json({
						error: 1,
						message: `You're not allowed to edit this data`
					})
				
				}
				
				user = await User.findOneAndUpdate(
					{_id: req.params.id},
					payload,
					{new: true, runValidators: true}
				).select('-password -__v -token');
				
				return res.json(user);
				
			}catch(err){
			console.log(err)
				if(err && err.name == 'ValidationError'){
					return res.json({
						error: 1,
						message: err.message,
						fields: err.errors
					});
				}
				next(err)
			}
}

async function store(req,res,next){
	
	try{
		
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Admin')){
			return res.json({
				error: 1,
				message: 'You have no access to add a Admin'
			})
		}
		
		const {name, email, password} = req.body;
		const user = new User({name, email, password, role: 'admin'});
		await user.save();
		
		return res.json(user);
	}catch(err){
		
		if(err && err.name == 'ValidationError'){ 
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			})
		}
		return next(err)
		
	}
}

module.exports = {
	update,
	store
}