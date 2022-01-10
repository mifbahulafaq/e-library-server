const router = require('express').Router();
const multer = require('multer');

const rackController = require('./controller');

router.get('/racks',rackController.index);
router.get('/racks/:id',rackController.singleData);
router.delete('/racks/:id',rackController.remove);
router.put('/racks/:id',multer().none(),rackController.update);
router.post('/racks',multer().none(),rackController.store);


module.exports = router;