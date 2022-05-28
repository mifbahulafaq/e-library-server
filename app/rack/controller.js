const Rack = require('./model');
const policyFor = require('../policy');

async function store(req,res,next){
    let payload = req.body;

    try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Rack')){
			return res.json({
				error: 1,
				message: 'You have no access to add a rack'
			})
		}
		
        let rack = new Rack(payload);
        await rack.save();
        return res.json(rack);

    }catch(err){

        if(err && err.name == 'ValidationError'){
			console.log()
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
		
        return next(err)
    }

}

async function index(req,res,next){
	
	let {limit= 10, skip= 0} = req.query;
	let filter = {}
	
	if(req.query.q){
		filter.name = {$regex: `${req.query.q}`, $options: 'i'}
	}
	
    try{
		
        const rack = await Rack.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit));
		
        return res.json(rack);
		
    }catch(err){
        return next(err)
    }

}

async function singleData(req,res,next){
    
    try{

        const rack = await Rack.findById(req.params.id);
        return res.json(rack);

    }catch(err){
        return next(err);
    }

}

async function remove(req,res,next){
	
	try{
		let policy = policyFor(req.user);
		
		if(!policy.can('delete','Rack')){
			return res.json({
				error: 1,
				message: 'You have no access to delete a rack'
			})
		}
		
		let rack = await Rack.findOneAndDelete({_id: req.params.id});
		return res.json(rack);
	}catch(error){
		return next(error)
	}

}

async function update(req,res,next){
    let payload = req.body;

    try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('update','Rack')){
			return res.json({
				error: 1,
				message: 'You have no access to edit a rack'
			})
		}

        let rack = await Rack.findOneAndUpdate(
		{_id: req.params.id},
		payload,
		{new: true, runValidators: true}
		);
			
        return res.json(rack);

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