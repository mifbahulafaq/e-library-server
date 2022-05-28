const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const logCirculationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
		required: [true, "User must be entered"]
    },
    detail_circulation: {
        type: Schema.Types.ObjectId,
        ref: 'DetailCirculation'
    },
    status: {
        type : String,
        enum : ['borrowed','returned'],
        required: [true, "Circulation status must be entered"]
    }
},{ timestamps: true});

module.exports = model('CirculationLog', logCirculationSchema);

