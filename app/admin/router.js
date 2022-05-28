const router = require('express').Router();
const multer = require('multer');

const membersController = require('./controller');

router.put('/admins/:id',multer().none(),membersController.update);
router.post('/admins',multer().none(),membersController.store);


module.exports = router;