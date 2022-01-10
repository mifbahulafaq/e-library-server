const CirculationLog = require('./model');
const policyFor = require('../policy');
const Member = require('../member/model');

async function index(req,res,next){
    try{
		
		let policy = policyFor(req.user);
		let filter = {}
		
		if(!policy.can('read','CirculationLog')){
			return res.json({
				error: 1,
				message: 'You have no access to read activity logs'
			})
		}
		
		let {skip=0, limit=5} = req.query;
		
		/*if(req.query.user){
			
			const idMembers = await Member
			.find({name: {$regex: `${req.query.user}`, $options: 'i'}})
			.select('_id');
			
			filter.detail_circulation {$regex: `${req.query.user}`, $options: 'i'}};
		}*/
        const circulationLog = await CirculationLog
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('user','-token -password')
		.populate({
			path:'detail_circulation', 
			populate: "circulation",
			populate: "book"
			
			})
		
		const count = await CirculationLog
		.find(filter)
		.countDocuments()
		
        return res.json({
			data: circulationLog,
			count
			})
		
    }catch(err){
        next(err)
    }

}

async function remove(req,res,next){
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('delete','CirculationLog')){
			return res.json({
				error: 1,
				message: 'You have no access to delete activity logs'
			})
		}
		
		let circulationLog = await CirculationLog.findOneAndDelete({_id: req.params.id});
		return res.json(circulationLog);
	}catch(err){
		next(err)
	}
}
module.exports = {
    index,
    remove
}