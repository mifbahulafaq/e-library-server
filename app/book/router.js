const router = require('express').Router();
const bookController = require('./controller');

router.get('/books',bookController.index);
router.get('/books/:id',bookController.singleData);
router.delete('/books/:id',bookController.remove);
router.put('/books/:id',bookController.update);
router.post('/books',bookController.store);


module.exports = router;