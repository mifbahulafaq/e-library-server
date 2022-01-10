module.exports = function (value){
	
	let [firstLetter,...remains] = value;
	firstLetter = firstLetter.toUpperCase();
	
	return [firstLetter,...remains].join('');
	
}
