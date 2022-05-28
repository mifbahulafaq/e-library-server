const User = require('./model');
const Member = require('../member/model');
const bcrypt = require('bcrypt');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const uppercase = require('../utils/uppercase');
const path = require('path');
const fs = require('fs')
const config = require('../config');

async function index(req,res,next){
	
	const {skip= 0, limit= 0, role} = req.query;
	const policy = policyFor(req.user);
	
	if(!policy.can('readall',role?uppercase(role):'user')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let filter = {name: {$regex: `${req.query.q || ''}`, $options: 'i'}};
	
	if(req.query.role){
		filter.role = req.query.role;
	}
	
	try{
		
		const users = await User
		.find(filter)
		.skip(skip)
		.limit(limit)
		.select('-password -token')
		.populate('member')
		.populate('operator')
		
		const count = await User
		.find(filter)
		.countDocuments();
		
		return res.json({
			data: users,
			count
		});
		
	}catch(err){
		next(err);
	}
}

async function singleData(req,res,next){
	
	const policy = policyFor(req.user);
	
	try{
		
		let user = await User.findOne({_id: req.params.id});
		const role = uppercase(user.role);
		
		const subjectUser = subject(role,{...user, user_id: user._id})
		
		if(!policy.can('read',subjectUser)){

			return res.json({
				error: 1,
				message: `You're not allowed to read this single data`
			})
		
		}
		
		user = await User.findOne({_id: req.params.id})
		.populate('member')
		.populate('operator')
		.select('-password -token -__v');
		
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
		.select('-password -token -__v');
				
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
		
		const {old_password, password} = req.body;
		
		let user = await User.findOne({_id: req.params.id});
		const role = uppercase(user.role);
		
		const subjectUser = subject(role, {...user, user_id: user._id});
		
		if(!policy.can('edit',subjectUser)){
			return res.json({
				error:1,
				message: `you're not allowed to modify this resource`
			})
		}
		
		if(bcrypt.compareSync(old_password, user.password)){
			
			await User.updateOne({_id: req.params.id}, {password: password}, {new: true, runValidators: true});
			return res.json({
				err: 0,
				message: 'Password changed'
			})
		}
		
		return res.json({
			error: 1,
			message: "Password not match"
		})
		
	}catch(err){
		
		if(err && err.name == 'ValidationError'){
			return res.json({
				error: 1,
				message: err.message,
				fields: err.errors
			})
		}
		return next(err);
		
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
				message: `You cannot delete this data`
			})
		}
		
		user = await User.findOneAndDelete({_id: req.params.id}).select('-password -token');
		const member = await Member.deleteOne({_id: req.params.id});
		return res.json(user);
		
	}catch(err){
		next(err)
	}


}

module.exports = {
	index,
	updateEmail,
	updatePass,
	singleData,
	remove
}