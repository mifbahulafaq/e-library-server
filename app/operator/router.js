const router = require('express').Router();

const operatorController = require('./controller');

router.get('/operators',operatorController.index);
router.get('/operators/:id',operatorController.singleData);
router.delete('/operators/:id',operatorController.remove);
router.put('/operators/:id',operatorController.update);
router.post('/operators',operatorController.store);


module.exports = router;