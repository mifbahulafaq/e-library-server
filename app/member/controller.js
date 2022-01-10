const Member = require('./model');
const User = require('../user/model');
const multer = require('multer');
const upload = require('../utils/img-upload').single('photo');
const path = require('path');
const fs = require('fs');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const config = require('../config');

async function register(req,res,next){
	upload(req,res, async function(err){
		//handling error uploading
		if(err instanceof multer.MulterError || err && err.name === "MulterError"){
			
			if(err.code === "LIMIT_FILE_SIZE"){
				return res.json({
					error: 1,
					message: err.message,
					maxSize: config.imageSize
				})
			}
			
			return res.json({
				error: 1,
				message: err.message
			})
		}
		if(err) return next(err);
		
		console.log(req.body)
		let {email,password,...payload} = req.body;
		
		if(req.file){
			try{
						
				let member = new Member({...payload, photo: req.file.filename});
				await member.save();
						
				const user = new User({
					_id: member._id,
					email,
					password,
					role: 'member',
					member: member._id
				})
				
				await user.save();
				return res.json(member);
				
			}catch(err){
				
				fs.unlinkSync(req.file.path);
				if(err && err.name == 'ValidationErorr'){
					return res.json({
						error: 1,
						message: err.message,
						fields: err.errors
					})
				}
				next(err)
			}
		}else{
			
			try{
				let member = new Member(payload);
				await member.save();
				
				const user = new User({
					_id: member._id,
					name: payload.name,
					email,
					password,
					role: 'member',
					member: member._id
				})
				await user.save();
				return res.json(member);
			}catch(err){
				if(err && err.name == 'ValidationError'){
					return res.json({
						error: 1,
						message: err.message,
						fields: err.errors
					})
				}
			
				next(err)
            }
        }
	})
}

async function index(req,res,next){
	
	const policy = policyFor(req.user);
	
	if(!policy.can('readall','Member')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let params = req.query;
	let {limit= 5, skip= 0} = params;
	let filter = {}
	
	if(params.q){
		filter.name = {$regex: `${params.q}`, $options: 'i'}
	}

    try{
		
        const members = await Member
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit));
		
        const count = await Member
		.find(filter)
		.countDocuments();
		
        return res.json({
			data: members,
			count
		});
    }catch(err){
        next(err)
    }

}

async function singleData(req,res,next){
	
	const policy = policyFor(req.user);
	
	let member = await Member.findOne({_id: req.params.id});
	
	const subjectMember = subject('Member', {...member, user_id: member._id});
	
	if(!policy.can('read',subjectMember)){
		return res.json({
			error:1,
			message: `You're not allowed to perform this action`
		})
	}
    
    try{

        const member = await Member
		.findOne({_id: req.params.id})
        return res.json(member);

    }catch(err){
        next(err);
    }

}

async function remove(req,res,next){
	
	const policy = policyFor(req.user);
	
	let member = await Member.findOne({_id: req.params.id});
	
	const subjectMember = subject('Member', {...member, user_id: member._id});
		
	if(!policy.can('delete',subjectMember)){
		return res.json({
			error:1,
			message: `You're not allowed to perform this action`
		})
	}
	
	try{
		
		let member = await Member.findOneAndDelete({_id: req.params.id});
		let user = await User.findOneAndDelete({member: member._id});
		if(member.photo){

			const currentPhoto = path.resolve(config.rootPath,`public/upload/${member.photo}`);
			if(fs.existsSync(currentPhoto)) fs.unlinkSync(currentPhoto);

		}
		return res.json(member);
		
	}catch(err){
		next(err)
	}


}

async function update(req,res,next){
	upload(req, res, async function(err){
	
		const policy = policyFor(req.user);
		
		let member = await Member.findOne({_id: req.params.id});
		
		const subjectMember = subject('Member', {...member, user_id: member._id});
			
		if(!policy.can('edit',subjectMember)){
			return res.json({
				error:1,
				message: `You're not allowed to perform this action`
			})
		}
		//handling error uploading
		if(err instanceof multer.MulterError || err && err.name === "MulterError"){
			
			if(err.code === "LIMIT_FILE_SIZE"){
				return res.json({
					error: 1,
					message: err.message,
					maxSize: config.imageSize
				})
			}
			
			return res.json({
				error: 1,
				message: err.message
			})
		}
		if(err) return next(err);
		
		let payload = req.body;
		
        if(req.file){
                
            try{

				let member = await Member.findOne({_id: req.params.id});
                    
				const memberUpdate = await Member.findOneAndUpdate(
					{_id: req.params.id},
                    {...payload, photo: req.file.filename},
					{new: true, runValidators: true}
                 );
					
                if(member.photo){
                    const currentPhoto = path.resolve(config.rootPath,`public/upload/${member.photo}`)
                    if(fs.existsSync(currentPhoto)) fs.unlinkSync(currentPhoto);
				}
				return res.json(memberUpdate);

            }catch(err){

                fs.unlinkSync(req.file.path);
                if(err && err.name == 'ValidationErorr'){
                    return res.json({
                        error: 1,
                        message: err.message,
                        fields: err.errors
                    })
                }
                next(err)
            }
        }else{
			try{
				let member = await Member.findOneAndUpdate(
					{_id: req.params.id},
					payload,
					{new: true, runValidators: true}
				);
				return res.json(member);
			}catch(err){
			
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
	})
}

module.exports = {
    register,
    index,
    singleData,
    remove,
    update
}