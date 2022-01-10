const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const bookingSchema = new Schema({
	date: {
		type: Date,
		required: [true, "Date must be entered"]
	},
	duration: {
		type: Number,
		required: [true, "Duration must be entered"]
	},
	member: {type : Schema.Types.ObjectId, ref : 'Member'}
},{timestamps:true});

module.exports = model('Booking', bookingSchema);

