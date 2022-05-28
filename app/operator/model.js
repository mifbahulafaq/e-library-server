const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const operatorSchema = new Schema({
    name: {
        type: String,
        minlength: [3, 'The minimum length of name is 3 characters'],
        maxlength: [255, 'The max length of name is 255 character'],
        required: [true, 'The name must be entered']
    },
    gender: {
        type: String,
        enum: ['male','female'],
        required: [true, 'enter your gender']
    },
    address: {
        type: String,
		maxlength: [1000, 'The maximum length of address is 1000 characters'],
		required: [true, 'Enter your address']
    },
    phone_number: String,
    photo: String
},{ timestamps: true});

module.exports = model('Operator', operatorSchema);

