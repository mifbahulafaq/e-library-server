const userController = require('./controller');
const router = require('express').Router();
const multer = require('multer');

router.get('/users/admins',userController.admin);
router.get('/users',userController.index);
router.get('/users/:id',userController.singleData);
router.put('/users/:id/email',multer().none(),userController.updateEmail);
router.put('/users/:id/password',multer().none(),userController.updatePass);
router.post('/users',multer().none(),userController.store);
router.delete('/users/:id',userController.remove);

module.exports = router;