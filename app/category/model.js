const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const categorySchema = new Schema({
    name: {
        type: String,
        minlength: [3, 'The minimum length of name is 3 characters'],
        maxlength: [255, 'The max length of name is 255 character'],
        required: [true, 'The name must be entered'],
		unique: true
    }
});

module.exports = model('Category', categorySchema);

