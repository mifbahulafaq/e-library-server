const multer = require('multer');
const path = require('path');
const config = require('../config');

const storage = multer.diskStorage({
	destination: function(req, file, cb){
		
		const pathTarget = path.resolve(config.rootPath,`public/upload`);
		
		cb(null, pathTarget);
	},
	filename: function(req, file, cb){
		console.log(file.encoding)
        let ext = file.originalname.split('.')
        [file.originalname.split('.').length - 1];
		
        let randName = Date.now()+ Math.round(Math.random()*1E9)+'.'+ext;
		
		cb(null, file.fieldname+'-'+randName)
	}
})

const fileFilter = function(req, file, cb){
    const ext = ['.jpg','.png','.jpeg'];
    const file2 = path.extname(file.originalname).toLocaleLowerCase();
	
    if(ext.indexOf(file2) == -1){
		
		const err = new Error(`What you uploaded is not an image`);
		err.name = "MulterError";
		
        return cb(err);
    }
    cb(null,true);
}

module.exports = multer({
	storage: storage,
    limits: {fileSize : config.imageSize},
	fileFilter: fileFilter
});