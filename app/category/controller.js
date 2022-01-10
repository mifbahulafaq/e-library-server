const Category = require('./model');
const policyFor = require('../policy');

async function store(req,res,next){
    let payload = req.body;

    try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Category')){
			return res.json({
				error: 1,
				message: 'You have no access to add a category'
			})
		}
		
        let category = new Category(payload);
        await category.save();
        return res.json(category);

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

async function index(req,res,next){
    try{
		
        const category = await Category.find();
        return res.json(category);
		
    }catch(err){
        next(err)
    }

}

async function singleData(req,res,next){
    
    try{

        const category = await Category.findById(req.params.id);
        return res.json(category);

    }catch(err){
        next(err);
    }

}

async function remove(req,res,next){
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('delete','Category')){
			return res.json({
				error: 1,
				message: 'You have no access to delete a category'
			})
		}
		
		let category = await Category.findOneAndDelete({_id: req.params.id});
		return res.json(category);
	}catch(err){
		next(err)
	}
}

async function update(req,res,next){
    let payload = req.body;

    try{

		let policy = policyFor(req.user);
		
		if(!policy.can('update','Category')){
			return res.json({
				error: 1,
				message: 'You have no access to edit a category'
			})
		}
		
        let category = await Category.findOneAndUpdate(
		{_id: req.params.id},
		payload,
		{new: true, runValidators: true}
		);
			
        return res.json(category);

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

module.exports = {
    store,
    index,
    singleData,
    remove,
    update
}