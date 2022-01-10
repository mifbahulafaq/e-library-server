const Circulation = require('./model');
const DetailCirculation = require('../detail-circulation/model');
const Member = require('../member/model');
const Book = require('../book/model');
const CirculationLog = require('../log-circulation/model');
const policyFor = require('../policy');

async function store(req,res,next){
	
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Circulation')){
			return res.json({
				error: 1,
				message: 'You have no access to add a circulation'
			})
		}
		
		const {date_of_return,member,detail} = req.body;
		
		//get total book 
		let books = detail.reduce((total,cv,ci,arr)=>{
			
			for(let i = 0; i<total.length; i++){
				
				if(total[i].book && total[i].book == cv.book){
					total[i].stock += 1;
					return total;
				}
			}
			return [...total,{book: cv.book, stock: 1}]
		},[])
		
		const filter = books.map((e,i)=>({
			_id: e.book,
			stock: {$gte: e.stock}
		}))
		const result = await Book.find({$or:filter}).select("id");
		
		if(books.length !== result.length){
			return res.json({
				error: 1,
				message: "the book you entered, exceeds the existing stock"
			})
		}
		
		//decrese stock
		await Book.bulkWrite(books.map(data=>{
				
				return {
					updateOne: {
						filter: {_id: data.book},
						update: {$inc:{stock: -data.stock}}
					}
				};
			})
		)
		
		let circulationLog = [];
		
		let circulation = new Circulation({
			date_of_loan: new Date(),
			date_of_return: date_of_return,
			member
		});
		await circulation.save();
		
		let detailPayload = detail.map(data=>{
			return {
				...data,
				circulation: circulation._id
			}
		});
		
		let detailCirculation = await DetailCirculation.insertMany(detailPayload);
		
		detailCirculation.forEach(detail=>{
			circulationLog.push({
				status: 'borrowing',
				user: req.user._id,
				detail_circulation: detail._id
			})
		});
		await CirculationLog.insertMany(circulationLog);
	
		return res.json(detailCirculation);
	
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

async function index(req,res,next){
	
	const policy = policyFor(req.user);
	
	if(!policy.can('read','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let {limit= 5, skip= 0} = req.query;
	let filter = {};
	
	let idCirculations = []
	if(req.user.role === 'member'){
		idCirculations = await Circulation
		.find({member:req.user._id})
		.select('_id');
		
		filter= {
			circulation: {$in: idCirculations.map(data=>data._id)} 
		}
	}
	
	if(req.query.q){
		
		const idMembers = await Member
		.find({name:{$regex:`${req.query.q}`,$options: 'i'}})
		.select('_id');
		
		idCirculations = await Circulation
		.find({_id:{$in: idCirculations}, member:{$in: idMembers.map(data=>data._id)}})
		.select('_id');
		
		filter = {
			circulation: {$in: idCirculations.map(data=>data._id)}
		}
	}
	
    try{
		
        const detailCirculation = await DetailCirculation
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('circulation');
		
		const count = await DetailCirculation.find(filter).countDocuments();
		
        return res.json({
			data: detailCirculation,
			count
		});
    }catch(err){
        next(err)
    }

}

async function loans(req,res,next){
	
	const policy = policyFor(req.user);
	
	if(!policy.can('read','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let params = req.query;
	let {limit= 5, skip= 0} = params;
	let filter = {status: 'borrowed'};
	let idCirculations = [];
	
	if(req.user.role === 'member'){
		idCirculations = await Circulation
		.find({member:req.user._id})
		.select('_id');
		
		filter.circulation= {$in: idCirculations.map(data=>data._id)}
	}
	
	if(req.query.q){
		
		const idMembers = await Member
		.find({name:{$regex:`${req.query.q}`,$options: 'i'}})
		.select('_id');
		
		idCirculations = await Circulation
		.find({_id:{$in: idCirculations}, member:{$in: idMembers.map(data=>data._id)}})
		.select('_id');
		
		filter.circulation= {$in: idCirculations.map(data=>data._id)}
	}

    try{
		
        const detailCirculation = await DetailCirculation
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('circulation');
		
		const count = await DetailCirculation.find(filter).countDocuments();
		
        return res.json({
			data: detailCirculation,
			count
		});
    }catch(err){
        next(err)
    }

}

async function returned(req,res,next){
	
    const policy = policyFor(req.user);
	
	if(!policy.can('edit','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
    try{
		const {user} = req.body;
		const obj = {
				$set: {
					status: 'returned',
					returned: new Date()
				}
			}
			
		let detailCirculation = await DetailCirculation
		.findOne({_id:req.params.id})
		.select('fine fine_payment -_id');
		
		const {fine_payment, fine} = detailCirculation;
		
		if(fine_payment < fine){
			return res.json({
				error: 1,
				message: 'Pay off this loan first'
			})
		}
		
        detailCirculation = await DetailCirculation
		.findOneAndUpdate({_id:req.params.id},obj,{new:true,runValidators: true});
		
		//increase stock
		await Book
		.updateOne({_id:detailCirculation.book},{$inc:{stock:1}},{new:true,runValidators: true})
		
		const circulationLog = new CirculationLog({
			user: req.user._id,
			detail_circulation: detailCirculation._id,
			status:'return'
		})
		await circulationLog.save();
        return res.json(detailCirculation);

    }catch(err){
        next(err);
    }

}

async function fine(req,res,next){
    const policy = policyFor(req.user);
	
	if(!policy.can('edit','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
    try{
		
		const {fine} = req.body;
		const filter = {_id:req.params.id, status: "borrowed"};
		
        const detailCirculation = await DetailCirculation
		.findOneAndUpdate(filter,{$set:{fine}},{new:true,runValidators: true});
		
		if(!detailCirculation){
			return res.json({
				error: 1,
				message: "this loan have been returned"
			})
		}
        return res.json(detailCirculation);

    }catch(err){
        next(err);
    }

}
async function payFine(req,res,next){
    const policy = policyFor(req.user);
	
	if(!policy.can('edit','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
    try{
		
		const {fine_payment} = req.body;
		const filter = {_id:req.params.id, status: "borrowed"};
		
        const detailCirculation = await DetailCirculation
		.findOneAndUpdate(filter,{$set:{fine_payment}},{new:true,runValidators: true});
		
		if(!detailCirculation){
			return res.json({
				error: 1,
				message: "You cannot pay the fine of this loan"
			})
		}
        return res.json(detailCirculation);

    }catch(err){
        next(err);
    }

}

module.exports = {
    store,
    index,
	loans,
	returned,
	fine,
	payFine
}