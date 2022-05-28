const Circulation = require('../app/circulation/model');
const DetailCirculation = require('../app/detail-circulation/model');
const config = require('../app/config');

async function fineCirculation(req,res,next){
	
	let newDate = new Date();
	newDate.setHours(0,0,0);
	newDate.setMilliseconds(86399999);
	
	try{
		
		const fineAndIDs = await Circulation.aggregate([
		
			{$match:{$expr:{$gt:[newDate,"$date_of_return"]}}},
			
			{$project: {
				
				fine: {
					$multiply: [
						{$ceil: {$divide: [{ $subtract: [newDate,"$date_of_return"]}, config.fineTime ] }},
						config.fine
					]
				}
			}}
		])
		
		let detailCirculations = fineAndIDs.map( data=>{
			
				
			let obj = {
				$set: {
					fine: data.fine
				}
			}
				
			return {
				updateMany: {
					filter: { circulation: data._id, status: "borrowed"},
					update: obj
				}
			};
		});
		
		await DetailCirculation.bulkWrite(detailCirculations);
		next();
		
	}catch(err){
		next(err)
	}
}

module.exports = {
	fineCirculation
}