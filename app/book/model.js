const mongoose = require('mongoose');
const {model, Schema} = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const bookSchema = new Schema({
    title: {
        type: String,
        minlength: [3, 'The minimum length of name is 3 characters'],
        maxlength: [255, 'The max length of name is 255 character'],
        required: [true, 'The name must be entered']
    },
    book_id: Number,
    author: {
        type: String,
        minlength: [3, 'The minimum length of author name is 3 characters'],
        maxlength: [255, 'The max length of author name is 255 character'],
        required: [true, 'The author name must be entered']
    },
    publisher: {
        type: String,
        minlength: [3, 'The minimum length of publisher name is 3 characters'],
        maxlength: [255, 'The max length of publisher name is 255 character'],
        required: [true, 'The publisher name must be entered']
    },
    stock: {
        type: Number,
        required: [true, "the stock must be entered"]
    },
    image: String,
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    rack: {
        type: Schema.Types.ObjectId,
        ref: 'Rack'
    }
},{ timestamps: true});

bookSchema.plugin(AutoIncrement, {inc_field: 'book_id'});

module.exports = model('Book', bookSchema);

