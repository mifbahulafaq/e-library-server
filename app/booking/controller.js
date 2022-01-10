const Booking = require('./model');
const DetailBooking = require('../detail-booking/model');
const Book = require('../book/model');
const Circulation = require('../circulation/model');
const DetailCirculation = require('../detail-circulation/model');
const CirculationLog = require('../log-circulation/model');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const config = require('../config');

async function store(req,res,next){
	
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Booking')){
			return res.json({
				error: 1,
				message: 'You have no access to add a circulation'
			})
		}
		
		const {member,duration,books} = req.body;
		
		//get total book 
		let totalBooks = books.reduce((total,cv,ci,arr)=>{
			
			for(let i = 0; i<total.length; i++){
				
				if(total[i].book && total[i].book == cv){
					total[i].stock += 1;
					return total;
				}
			}
			return [...total,{book: cv, stock: 1}]
		},[])
		
		const filter = totalBooks.map((e,i)=>({
			_id: e.book,
			stock: {$gte: e.stock}
		}))
		const result = await Book.find({$or:filter}).select("id");
		
		if(totalBooks.length !== result.length){
			return res.json({
				error: 1,
				message: "the book you entered exceeds the existing stock"
			})
		}
		
		//decrese stock
		await Book.bulkWrite(totalBooks.map(data=>{
				
				return {
					updateOne: {
						filter: {_id: data.book},
						update: {$inc:{stock: -data.stock}}
					}
				};
			})
		)
		
		
		let booking = new Booking({
			date: new Date(),
			member: member,
			duration: duration
		});
		await booking.save();
		
		const detailBooking = await DetailBooking.insertMany(books.map(idBook=>({
			booking:booking._id,
			remaining_duration: duration,
			book:idBook
		})));
	
		return res.json(detailBooking);
	
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



async function index(req,res,next){
	
	const policy = policyFor(req.user);
	
	if(!policy.can('readall','Booking')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let params = req.query;
	let {limit= 5, skip= 0} = params;
	let filter = {};
	
	if(req.user.role === 'member'){
		filter= {
			"booking.member": req.user._id
		}
	}
	/*if(params.q){
		filter = {
			"member.name": {$regex: `${params.q}`, $options: 'i'},...filter
		}
	}*/

    try{
		
        let detailBookings = await DetailBooking
		.find({status: "unprocessed",...filter})
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('booking');
		
		//24 hours = 86400000;
		//expired
		
		detailBookings = detailBookings.map( data=>{
			
			const date = data.booking.date.getTime();
			const runningTime = Date.now() - date;
				
			let remainingDuration = data.booking.duration - runningTime;
				
			let obj = {
				$set: {
					remaining_duration: remainingDuration
				}
			}
			
			
			if(remainingDuration < 1) {
					
				obj.$set.remaining_duration = 0;
				obj.$set.status = "expired";
				
				(async function updateStock(){
					await Book
					.updateOne({_id:data.book},{$inc:{stock:1}},{runValidators: true});
				})();
			}
				
			return {
				updateOne: {
					filter: {_id: data._id},
					update: obj
				}
			};
		});
		
		await DetailBooking.bulkWrite(detailBookings);
		
		detailBookings = await DetailBooking
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate('booking')
		.populate('book');
		
		const count = await DetailBooking.find(filter).countDocuments();
		
        return res.json({
			data: detailBookings,
			count
		});
    }catch(err){
        next(err)
    }

}

async function process(req,res,next){
    const policy = policyFor(req.user);
	
	if(!policy.can('edit','Booking')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
    try{
		const detailId = req.params.detail_id;
		const {date_of_return} = req.body;
		
		let detailBooking = await DetailBooking
		.findOne({_id: detailId,status: 'unprocessed'})
		.populate("booking");
		
		if(!detailBooking){
			return res.json({
				error: 1,
				message: "Data not found or expired"
			})
		}
		
		//update duration
		const date = detailBooking.booking.date.getTime();
		const runningTime = Date.now() - date;
		let remainingDuration = detailBooking.booking.duration - runningTime;
				
		let obj = {$set: {remaining_duration: remainingDuration}};
		
		if(remainingDuration < 1) {
					
			obj.$set.remaining_duration = 0;
			obj.$set.status = "expired";
			
			await Book
			.updateOne({_id:detailBooking.book},{$inc:{stock:1}},{new:true,runValidators: true});
		}
		
		detailBooking = await DetailBooking
		.findOneAndUpdate({_id: detailBooking._id},obj,{new:true,runValidators: true})
		.populate('booking');
		
		if(detailBooking.status !== "unprocessed"){
			return res.json({
				error: 1,
				message: "it's been expired, You cannot process this booking"
			})
		}
		
		//const dateOfReturn = 60000*60*24*7 + Date.now();
		
        detailBooking = await DetailBooking
		.findOneAndDelete({_id:detailBooking._id,status: 'unprocessed'})
		.populate('booking');
		
		let circulation = new Circulation({
			date_of_loan: new Date(),
			date_of_return: date_of_return,
			member: detailBooking.booking.member
		});
		await circulation.save();
		
		const detailCirculation = new DetailCirculation({
			circulation: circulation._id,
			book: detailBooking.book
		});
		await detailCirculation.save();
		
		const circulationLog = new CirculationLog({
			user: req.user._id,
			detail_circulation: detailCirculation._id,
			status:'borrowing'
		})
		await circulationLog.save();
		
		return res.json(detailCirculation)

    }catch(err){
        next(err);
    }

}
async function remove(req,res,next){
    const policy = policyFor(req.user);
	
	const detailBooking = await DetailBooking
	.findOne({_id: req.params.detail_id}).
	populate('booking');
	console.log(detailBooking)
	
	const subjectDetail = subject('Booking',{...detailBooking,user_id: detailBooking.booking.member});
	
	if(!policy.can('delete',subjectDetail)){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
    try{
		
        const detailBooking = await DetailBooking
		.findOneAndDelete({_id:req.params.detail_id});
		
		await Book
		.updateOne({_id:detailBooking.book},{$inc:{stock:1}},{runValidators: true});
		
        return res.json(detailBooking);

    }catch(err){
        next(err);
    }

}


module.exports = {
    store,
    index,
	process,
	remove
}