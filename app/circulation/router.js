const router = require('express').Router();
const multer = require('multer');

const circulationController = require('./controller');

router.get('/circulations',circulationController.index);
router.get('/circulations/loans',circulationController.loans);
router.put('/circulations/:id/return',multer().none(),circulationController.returned);
router.put('/circulations/:id/fine',multer().none(),circulationController.fine);
router.put('/circulations/:id/pay',multer().none(),circulationController.payFine);
router.post('/circulations',multer().none(),circulationController.store);


module.exports = router;