const Circulation = require('./model');
const DetailCirculation = require('../detail-circulation/model');
const Member = require('../member/model');
const Book = require('../book/model');
const CirculationLog = require('../log-circulation/model');
const policyFor = require('../policy');
const { subject } = require('@casl/ability');
const config = require('../config');
const pdf = require('html-pdf');
const fs = require("fs");
const path = require('path');

async function store(req,res,next){
	
	try{
		
		let policy = policyFor(req.user);
		
		if(!policy.can('create','Circulation')){
			return res.json({
				error: 1,
				message: 'You have no access to add a circulation'
			})
		}
		
		let  {date_of_return,member,detail} = req.body;
		
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
			stock: {$lt: e.stock}
		}))
		const result = await Book.find({$or:filter}).select("id");
		
		if(result.length){
			return res.json({
				error: 1,
				books: result,
				//message: "the book you entered, exceeds the existing stock"
				message: "Stok buku habis"
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
		let theDate = new Date();
		theDate.setHours(0,0,0);
		theDate.setMilliseconds(86399999);
		theDate.setDate(theDate.getDate() + Number(date_of_return))
		
		let circulation = new Circulation({
			date_of_loan: new Date(),
			date_of_return: theDate,
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
				status: 'borrowed',
				user: req.user._id,
				detail_circulation: detail._id
			})
		});
		await CirculationLog.insertMany(circulationLog);
	
		return res.json(detailCirculation);
	
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

async function index(req,res,next){
	const policy = policyFor(req.user);
	
	if(!policy.can('read','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}
	
	let {limit= 5, skip= 0, status, detailId, start_date, end_date} = req.query;
	let filter = {};
	let idCirculations = []
	
	if (start_date) {
		
		let date = new Date(start_date);
		filter.createdAt =  { $gte :  date}
	}
	
	if (end_date) {
		
		let date = new Date(end_date);
		date.setDate(date.getDate()+1);
		filter.createdAt =  { ...filter.createdAt, $lt :  date}
	}
	
	if(req.user.role === 'member'){
		idCirculations = await Circulation
		.find({member:req.user._id})
		.select('_id');
		
		filter= {
			circulation: {$in: idCirculations.map(data=>data._id)} 
		}
	}
	
	if(status) filter.status = {$in: status};
	if(detailId) filter._id = detailId;
	//jika waktu sekarang lebih satu hari dari "date_of_return", maka denda 
	if(req.user.role !== 'member' && req.query.q){
		
		const idMembers = await Member
		.find({name:{$regex:`${req.query.q}`,$options: 'i'}})
		.select('_id');
		
		idCirculations = await Circulation
		.find({member:{$in: idMembers.map(data=>data._id)}})
		.select('_id');
		
		filter.circulation= {$in: idCirculations.map(data=>data._id)}
	}
	
    try{
		
        let detailCirculations = await DetailCirculation
		.find(filter)
		.skip(parseInt(skip))
		.limit(parseInt(limit))
		.populate({
			path: 'circulation',
			populate: {path: 'member'}
		})
		.populate({
			path: 'book',
			populate: [ 
				{path: 'rack'},
				{path: 'category'}
			]
		})
		.sort('-updatedAt')
		
		const count = await DetailCirculation.find(filter).countDocuments();
		
        return res.json({
			data: detailCirculations,
			count
		});
    }catch(err){
        next(err)
    }

}

async function singleData(req,res,next){
    
    try{
	
		const policy = policyFor(req.user);
		
		let detailCirculation = await DetailCirculation
		.findOne({_id: req.params.id})
		.populate({
			path: 'circulation',
			populate: {path: 'member'}
		})
		
		const subjectCirculation = subject('Circulation', {...detailCirculation, user_id: detailCirculation.circulation.member?._id});
		
		if(!policy.can('singleRead',subjectCirculation)){
			return res.json({
				error:1,
				message: `You're not allowed to perform this action`
			})
		}
		
		//fine
		const circulation = await Circulation.findOne({
					_id:detailCirculation.circulation._id,
					$expr:{$gt:[new Date(),"$date_of_return"]}
				})
				
		if(circulation){
			
			const fine = Math.ceil((new Date() - circulation.date_of_return) / config.fineTime) * config.fine;
			
			await DetailCirculation
			.updateOne({_id: req.params.id, status: "borrowed"},{$set: {fine}},{runValidators: true})
		}
		//fine end..
		
		detailCirculation = await DetailCirculation
		.findOne({_id: req.params.id})
		.populate({
			path: 'circulation',
			populate: {path: 'member'}
		})
		.populate({
			path: 'book',
			populate: [{path: 'rack'}, {path: 'category'}]
		})
		
        return res.json(detailCirculation);

    }catch(err){
		console.log(err)
        next(err);
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
			status:'returned'
		})
		
		await circulationLog.save();
        return res.json(detailCirculation);

    }catch(err){
        next(err);
    }

}

/*async function fine(req,res,next){
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

}*/

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
		.findOneAndUpdate(filter,{$set:{fine_payment: Number(fine_payment)}},{new:true,runValidators: true});
		
		if(!detailCirculation){
			return res.json({
				error: 1,
				message: "You cannot pay the fine of this loan or this loan have returned"
			})
		}
        return res.json(detailCirculation);

    }catch(err){
        next(err);
    }

}

async function report(req,res,next){
	
	const policy = policyFor(req.user);
	
	/*if(!policy.can('read','Circulation')){
		return res.json({
			error: 1,
			message: `you're not allowed to perform this action`
		})
	}*/
	
	let filter ={};
	let {start_date, end_date} = req.query;
	
	if (start_date) {
		
		let date = new Date(start_date);
		filter.createdAt =  { $gte :  date}
	}
	
	if (end_date) {
		
		let date = new Date(end_date);
		date.setDate(date.getDate()+1);
		filter.createdAt =  { ...filter.createdAt, $lt :  date}
	}
	
	let idCirculations = []
	
	/*if(req.user.role === 'member'){
		idCirculations = await Circulation
		.find({member:req.user._id})
		.select('_id');
		
		filter.circulation= {$in: idCirculations.map(data=>data._id)}
	}*/
	
    try{
		
        const detailCirculations = await DetailCirculation
		.find(filter)
		.populate({
			path: 'circulation',
			populate: {path: 'member'}
		})
		.populate({
			path: 'book',
			populate: {path: 'rack'},
			populate: {path: 'category'}
		});
		
		const filename = `circulation-${start_date||'~'}-${end_date||'~'}`;
        const circulationEjs = path.join(__dirname,'../../report-html/pdf/circulation.ejs');
		//res.render(circulationEjs,{data : detailCirculations});
		res.render(circulationEjs,{data : detailCirculations},(err,html)=>{
			
			if(err) return next(err);
			
			const option = {
					format : 'A4',
					orientation: "landscape"
			}
			pdf.create(html,option).toFile(`./report-pdf/pdf/${filename}.pdf`,(err,path)=>{
				const options = {
					headers : {
						'Content-Disposition': `inline; filename=${filename}.pdf`
						//ini berpengaruh ketika request melalui url browser
					}
				}
				res.sendFile(path.filename,options,(err)=>{
					
					if(err) return next(err);
					fs.unlinkSync(path.filename);
				});
			})
		})
		
    }catch(err){
        return 	next(err)
    }

}

module.exports = {
    store,
    index,
	returned,
	//fine,
	payFine,
	singleData,
	report
}