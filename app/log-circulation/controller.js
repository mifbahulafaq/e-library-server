const CirculationLog = require('./model');
const policyFor = require('../policy');
const Circulation = require('../circulation/model');
const DetailCirculation = require('../detail-circulation/model');
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
		
		if(req.query.q){
			
			const idMembers = await Member
			.find({name:{$regex:`${req.query.q}`,$options: 'i'}})
			.select('_id');
			
			const idCirculations = await Circulation
			.find({member:{$in: idMembers.map(data=>data._id)}})
			.select('_id');
			
			const detailCirculation = await DetailCirculation
			.find({circulation:{$in: idCirculations.map(data=>data._id)}})
			.select('_id');
			
			filter.detail_circulation= {$in: detailCirculation.map(data=>data._id)}
		}
		
        const circulationLog = await CirculationLog
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate({
			path:'detail_circulation',
			populate:[
				{
					path:'circulation',
					populate:'member'
				},
				{path:'book'}
			]
			
		}).
		populate('user')
		.sort('-updatedAt')
		
		const count = await CirculationLog
		.find(filter)
		.countDocuments()
		
        return res.json({
			data: circulationLog,
			count
			})
		
    }catch(err){
		console.log(err)
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