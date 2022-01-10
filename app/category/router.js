const router = require('express').Router();
const multer = require('multer');

const categoryController = require('./controller');

router.get('/categories',categoryController.index);
router.get('/categories/:id',categoryController.singleData);
router.delete('/categories/:id',categoryController.remove);
router.put('/categories/:id',multer().none(),categoryController.update);
router.post('/categories',multer().none(),categoryController.store);

module.exports = router;