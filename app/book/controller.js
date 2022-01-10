const Book = require('./model');
const Category = require('../category/model');
const Rack = require('../rack/model');
const multer = require('multer');
const upload = require('../utils/img-upload').single('image');
const path = require('path');
const fs = require('fs');
const policyFor = require('../policy');
const config = require('../config');

async function store(req,res,next){
	upload(req, res, async function(err){
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Book')){
			return res.json({
				error: 1,
				message: 'You have no access to add a book'
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
                let book = new Book({...payload, image: req.file.filename});
                await book.save();
                return res.json(book);
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
				let book = new Book(payload);
				await book.save();
				return res.json(book);
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
	
	const policy = policyFor(req.user);
	
	if(!policy.can('read','Book')){
		return res.json({
			error: 1,
			message: 'you cannot '
		})
	}
	
	let {limit= 5, skip= 0} = req.query;
	let filter = {}
	
	if(req.query.category){
		
		let categoryId = await Category.findOne({name: {$regex: `${req.query.category}`, $options: 'i'}}).select({_id: 1});
		if(categoryId) filter.category = categoryId;
	}
	
	if(req.query.rack){
		
		let rackId = await Rack.findOne({name: {$regex: `${req.query.rack}`, $options: 'i'}}).select({_id: 1});
		if(rackId) filter.rack = rackId;
	}
	
	if(req.query.q){
		filter.name = {$regex: `${req.query.q}`, $options: 'i'}
	}

    try{
		
        const books = await Book
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('category')
		.populate('rack');
		
		const count = await Book.find(filter).countDocuments();
		
        return res.json({
			data: books,
			count
		});
    }catch(err){
        next(err)
    }

}

async function singleData(req,res,next){
    
    try{

        const book = await Book
		.findById(req.params.id)
		.populate('category')
		.populate('rack');
        return res.json(book);

    }catch(err){
        next(err);
    }

}

async function remove(req,res,next){
	
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('delete','Book')){
			return res.json({
				error: 1,
				message: 'You have no access to delete a book'
			})
		}
		
		let book = await Book.findOneAndDelete({_id: req.params.id});
		if(book.image){

			const currentImage = path.resolve(config.rootPath,`public/upload/${book.image}`);
			if(fs.existsSync(currentImage)) fs.unlinkSync(currentImage);

		}
		return res.json(book);
		
	}catch(err){
		next(err)
	}


}

async function update(req,res,next){
	upload(req, res, async function(err){
		
		let policy = policyFor(req.user);
		
		if(!policy.can('update','Book')){
			return res.json({
				error: 1,
				message: 'You have no access to edit a book'
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
				
				const book = await Book.findOneAndUpdate(
					{_id: req.params.id},
					{...payload, image: req.file.filename},
					{new: true, runValidators: true}
					);
				return res.json(book);

				let bookImg = await Book.findOne({_id: req.params.id});
				if(bookImg.image){
					const currentImage = path.resolve(config.rootPath,`public/upload/${bookImg.image}`)
					if(fs.existsSync(currentImage)) fs.unlinkSync(currentImage);
				}
				
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
				let book = await Book.findOneAndUpdate(
					{_id: req.params.id},
					payload,
					{new: true, runValidators: true}
				);
				return res.json(book);
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