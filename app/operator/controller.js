const Operator = require('./model');
const User = require('../user/model');
const path = require('path');
const fs = require('fs')
const multer = require('multer');
const upload = require('../utils/img-upload').single('photo');
const config = require('../config');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');

async function store(req,res,next){
	upload(req, res, async function(err){
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Operator')){
			return res.json({
				error: 1,
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
		
		let {email,password,...payload} = req.body;
		
		if(req.file){
			try{
				
				let operator = new Operator({...payload, photo: req.file.filename});
				await operator.save();
				
				let user = new User({
					_id: operator._id,
					email,
					password,
					role: 'operator',
					operator: operator._id
				})
				await user.save();
				
				return res.json(operator);
					
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
				
				let operator = new Operator(payload);
				await operator.save();
				
				const user = new User({
					_id: operator._id,
					name: payload.name,
					email,
					password,
					role: 'operator',
					operator: operator._id
				})
				await user.save();
				
				return res.json(operator);
				
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

async function index(req,res,next){
	
	let policy = policyFor(req.user);
		
	if(!policy.can('readall','Operator')){
		return res.json({
			error: 1,
			message: `You're not allowed to perform this action`
		})
	}
	let params = req.query;
	let {limit= 5, skip= 0} = params;
	let filter = {}
	
	if(params.q){
		filter.name = {$regex: `${params.q}`, $options: 'i'}
	}

    try{
		
        const operators = await Operator
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		
        return res.json(operators);
    }catch(err){
		
        next(err)
    }

}

async function singleData(req,res,next){
	
	const policy = policyFor(req.user);
	
	let operator = await Operator.findOne({_id: req.params.id});
	
	const subjectOperator = subject('Operator', {...member, user_id: member._id});
	
	if(!policy.can('read',subjectOperator)){
		return res.json({
			error:1,
			message: `You're not allowed to perform this action`
		})
	}
    
    try{

        const operator = await Operator
		.findOne({_id: req.params.id})
        return res.json(operator);

    }catch(err){
        next(err);
    }

}

async function remove(req,res,next){
	
	let policy = policyFor(req.user);
	
	let operator = await Operator.findOne({_id: req.params.id});
	
	let subjectOperator = subject("Operator",{...operator, user_id: operator._id});
	
	if(!policy.can("delete", subjectOperator)){
		return res.json({
			error: 1,
			message: `You're not allowed to perform this action`
		})
	}
	
	try{
		
		let operator = await Operator.findOneAndDelete({_id: req.params.id});
		let user = await User.findOneAndDelete({operator: operator._id});
		if(operator.photo){

			const currentPhoto = path.resolve(`public/upload/${operator.photo}`);
			if(fs.existsSync(currentPhoto)) fs.unlinkSync(currentPhoto);

		}
		return res.json(operator);
		
	}catch(err){
		next(err)
	}


}


async function update(req,res,next){
	upload(req, res, async function(err){
	
		const policy = policyFor(req.user);
		
		let operator = await Operator.findOne({_id: req.params.id});
		
		const subjectOperator = subject('Operator', {...operator, user_id: operator._id});
			
		if(!policy.can('edit',subjectOperator)){
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

				let operator = await Operator.findOne({_id: req.params.id});
                    
				const operatorUpdate = await Operator.findOneAndUpdate(
					{_id: req.params.id},
                    {...payload, photo: req.file.filename},
					{new: true, runValidators: true}
                 );
					
                if(operator.photo){
                    const currentPhoto = path.resolve(config.rootPath,`public/upload/${operator.photo}`)
                    if(fs.existsSync(currentPhoto)) fs.unlinkSync(currentPhoto);
				}
				return res.json(operatorUpdate);

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
				let operator = await Operator.findOneAndUpdate(
					{_id: req.params.id},
					payload,
					{new: true, runValidators: true}
				);
				return res.json(operator);
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
    store,
    index,
    singleData,
    remove,
    update
}