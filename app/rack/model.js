const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const rackSchema = new Schema({
    name: {
        type: String,
        required: [true, 'The name must be entered'],
		unique: true
    }
});

module.exports = model('Rack', rackSchema);

