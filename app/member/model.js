const mongoose = require('mongoose');
const {model, Schema} = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const memberSchema = new Schema({
    name: {
        type: String,
        minlength: [3, 'The minimum length of name is 3 characters'],
        maxlength: [255, 'The max length of name is 255 character']
    },
    member_id: Number,
    gender: {
        type: String,
        enum: ['male','female'],
        required: [true, 'enter your gender']
    },
    place: {
        type: String,
        maxlength: [255, 'The maximum lengt of place is 255 characters'],
		required: [true, 'Enter where you born is']
    },
    date_of_birth:{
		type: Date,
		required: [true, 'Enter your date of birth']
	},
    address: {
        type: String,
		maxlength: [1000, 'The maximum length of address is 1000 characters'],
		required: [true, 'Enter your address']
    },
    phone_number: Number,
    photo: {
		type: String
	}
},{ timestamps: true});

memberSchema.plugin(AutoIncrement, {inc_field: 'member_id'});

module.exports = model('Member', memberSchema);

