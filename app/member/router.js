const router = require('express').Router();
const multer = require('multer');
const os = require('os');
const upload = multer({dest: os.tmpdir()});

const membersController = require('./controller');

router.get('/members',membersController.index);
router.get('/members/:id',membersController.singleData);
router.delete('/members/:id',membersController.remove);
router.put('/members/:id',membersController.update);
router.post('/members',membersController.register);


module.exports = router;