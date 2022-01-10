const User = require('./model');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const uppercase = require('../utils/uppercase');

async function index(req,res,next){
	
	const {skip= 0, limit= 0} = req.query;
	
	try{
		
		const users = await User
		.find({name: {$regex: `${req.query.q || ''}`, $options: 'i'}})
		.skip(skip)
		.limit(limit)
		.select('-password');
		
		return res.json(users);
		
	}catch(err){
		next(err);
	}
}
async function admin(req,res,next){
	
	const {skip= 0, limit= 0} = req.query;
	
	try{
		
		const users = await User
		.find({role: "admin", name: {$regex: `${req.query.q || ''}`, $options: 'i'}})
		.skip(skip)
		.limit(limit)
		.select('-password');
		
		return res.json(users);
		
	}catch(err){
		next(err);
	}
}

async function singleData(req,res,next){
	
	try{
		const user = await User.findOne(req.params.id);
		return res.json(user);
	}catch(err){
		next(err)
	}
	
}

async function updateEmail(req,res,next){

	const policy = policyFor(req.user);
	
	try{
		
		const {email} = req.body;
		
		let user = await User.findOne({_id: req.params.id});
		const role = uppercase(user.role);
		
		const subjectUser = subject(role,{...user, user_id: user._id})
		
		if(!policy.can('edit',subjectUser)){

			return res.json({
				error: 1,
				message: `You're not allowed to modify this resource`
			})
		
		}
	
		user = await User.findOneAndUpdate(
		{_id: req.params.id}, 
			{email}, 
		{new: true, runValidators: true, context: 'query'}
		)
		.select('-password -token');
		
		return res.json(user);
		
	}catch(err){
		
		if(err && err.name == 'ValidationError'){
			//console.log(err)
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			})
		}
		
		return next(err);
		
	}
}

async function updatePass(req,res,next){
	
	const policy = policyFor(req.user);
	
	try{
		
		const {password} = req.body;
		
		let user = await User.findOne({_id: req.params.id});
		const role = uppercase(user.role);
		
		const subjectUser = subject(role, {...user, user_id: user._id});
		
		if(!policy.can('edit',subjectUser)){
			return res.json({
				error:1,
				message: `you're not allowed to modify this resource`
			})
		}
		
		user = await User
		.findOneAndUpdate({_id: req.params.id}, {password}, {new: true, runValidators: true})
		.select('-password -token -__v');
		
		return res.json(user);
		
	}catch(err){
		
		if(err && err.name == 'ValidationError'){
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			})
		}
		
	}
}

async function store(req,res,next){
	
	try{
		
		
		let policy = policyFor(req.user);
		
		/*if(!policy.can('create','Admin')){
			return res.json({
				error: 1,
				message: 'You have no access to add a Admin'
			})
		}*/
		
		const payload = req.body;
		const user = new User({...payload, role: 'admin'});
		await user.save();
		
		return res.json(user);
	}catch(err){
		
			console.log(err)
		if(err && err.name == 'ValidationError'){ 
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			})
		}
		
	}
}

async function remove(req,res,next){
	
	const policy = policyFor(req.user);
	
	try{
	
		let user = await User.findOne({_id: req.params.id});
		const role = uppercase(user.role);
		
		const subjectUser = subject(role, {...user, user_id: user._id});
		
		if(!policy.can('delete',subjectUser)){
			return res.json({
				error:1,
				message: `You're not allowed to perform this action`
			})
		}
		
		user = await User.findOneAndDelete({_id: req.params.id}).select('-password -token');
		return res.json(user);
		
	}catch(err){
		console.log(err)
		next(err)
	}


}

module.exports = {
	index,
	store,
	updateEmail,
	updatePass,
	singleData,
	remove,
	admin
}