const mongoose = require('mongoose');
const {model, Schema} = mongoose;
const bcrypt = require('bcrypt');
const HASH_ROUND = 10;

const userSchema = new Schema({
    name: {
        type: String,
        minlength: [3, 'The minimum length of name is 3 characters'],
        maxlength: [255, 'The max length of name is 255 character']
    },
    email: {
        type: String,
        required: [true, 'Enter your email'],
		maxlength: [255, 'The maximum length of email is 255 characters '],
		unique: true
    },
    password: {
        type: String,
        required: [true, 'Enter your password'],
		maxlength: [255, 'The maximum length of password is 255 characters ']
    },
    role: {
        type: String,
		enum: ['admin','operator','member'],
        required: [true, 'The role must be entered'],
    },
    token: [String],
    member: {
        type: Schema.Types.ObjectId,
		ref: 'Member'
    },
    operator: {
        type: Schema.Types.ObjectId,
		ref: 'Operator'
    }
});

userSchema.path('email').validate(

	function(value){
		
		const EMAIL_RE = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
		return EMAIL_RE.test(value);
	}, attr=>{
		
	return `${attr.value} must be a valid email`

});

userSchema.path('email').validate(async function(value){
	try{
		
		//for update validator
		if(this.model.countDocuments){
			const { _id } = this.getFilter()
			
			const count = await this.model.countDocuments({email: value, _id:{$ne: _id}});
			return !count;
		
		}
		
		// for document validator
		const count = await this.model('User').countDocuments({email: value});
		return !count;
		
	}catch(err){
		console.log(err)
		throw err
		
	}
	
}, attr=>`${attr.value} have been registered`);

userSchema.pre(['save','findOneAndUpdate','updateOne'], function(next){
	
	try{
		
		if(this.getUpdate && this.getUpdate().password){
			
			const pwd= this.getUpdate().password;
			
			this.getUpdate().password = bcrypt.hashSync(pwd, HASH_ROUND);
			
			return next()
		
		}
		
		if(this.password){
			this.password = bcrypt.hashSync(this.password, HASH_ROUND);
			return next();
		}
		return next()
	}catch(err){
		console.log(err)
		next(err)
		
	}
	
})

module.exports = model('User', userSchema);

