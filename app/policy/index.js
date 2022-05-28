const { AbilityBuilder, Ability } = require('@casl/ability');

const policies = {
	
	admin(user, {can, cannot}){
		can('manage','all');
		cannot('create','Booking');
		can('edit','Admin',{user_id: user._id});
	},
	operator(user, {can, cannot}){
		can('manage','Book');
		can('manage','Category');
		can('manage','Rack');
		can('manage','Booking');
		cannot('create','Booking');
		can('read','Operator',{user_id: user._id});
		can('edit','Operator',{user_id: user._id});
		can('delete','Operator',{user_id: user._id});
		can('read','Loan');
		can('manage','Circulation');
		can('manage','Member');
		can('manage','CirculationLog');
		can('login','User',{user_id: user._id});
		can('logout','User',{user_id: user._id});
		
	},
	member(user, {can, cannot}){
		
		can('read','Book');
		can('edit','Member',{user_id: user._id});
		can('read','Loan');
		can('read','Circulation');
		can('singleRead','Circulation',{user_id: user._id});
		can('create','Booking');
		can('readall','Booking');
		can('delete','Booking',{user_id: user._id});
		can('read','Member',{user_id: user._id});
		can('delete','Member',{user_id: user._id});
		can('login','User',{user_id: user._id});
		can('logout','User',{user_id: user._id});
		
	},
}


function policyFor(user){
	
	let builder = new AbilityBuilder();
	
	if(user && typeof policies[user.role] === "function" ){
		policies[user.role](user, builder);
	}else{
		
		builder.can('login','User')
		builder.can('logout','User');
	}
	
	return new Ability(builder.rules);
}

module.exports = policyFor;