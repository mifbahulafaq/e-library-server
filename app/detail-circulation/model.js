const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const detailCirculationSchema = new Schema({
	circulation: {type : Schema.Types.ObjectId, ref : 'Circulation'},
    returned: Date,
    fine: {
        type: Number,
        default: 0
    },
    fine_payment: {
		type: Number,
		default: 0
	},
    status: {
        type : String,
        enum : ['borrowed','returned'],
        default : 'borrowed'
    },
    description: {
        type : String,
        maxlength : [1000,"the max length of description is 1000 character"]
    },
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book'
    }
},{ timestamps: true});

module.exports = model('DetailCirculation', detailCirculationSchema);

