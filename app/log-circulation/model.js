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
        enum : ['borrowing','return'],
        required: [true, "Circulation status must be entered"]
    }
});

module.exports = model('CirculationLog', logCirculationSchema);

