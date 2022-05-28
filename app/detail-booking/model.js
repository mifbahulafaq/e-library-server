const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const detailBookingSchema = new Schema({
    booking:{type : Schema.Types.ObjectId, ref : 'Booking'},
	remaining_duration: {
		type: Number,
		required: [true, "The duration must be entered"]
	},
    status: {
        type: String,
		enum: ['unprocessed','expired'],
		default: 'unprocessed'
    },
    book:{type : Schema.Types.ObjectId, ref : 'Book'}
},{timestamps:true});

module.exports = model('DetailBooking', detailBookingSchema);

