const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const circulationSchema = new Schema({
    member: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    },
    date_of_loan: {
        type: Date,
        required: [true, 'The date of loan must be entered']
    },
    date_of_return: {
        type: Date,
        required: [true, 'The date of return must be entered']
    }
});

module.exports = model('Circulation', circulationSchema);

