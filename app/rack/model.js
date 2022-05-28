const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const rackSchema = new Schema({
    name: {
        type: String,
        maxlength: [255, 'The max length of name is 255 character'],
        required: [true, 'The name must be entered'],
		unique: true
    }
});

module.exports = model('Rack', rackSchema);

