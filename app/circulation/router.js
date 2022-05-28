const router = require('express').Router();
const multer = require('multer');
const { fineCirculation } = require('../../middlewares/fineCirculation');
const circulationController = require('./controller');

router.get('/circulations',fineCirculation,circulationController.index);
router.get('/circulations/report',circulationController.report);
//router.get('/circulations/report-attachment',circulationController.reportAttachment);
router.get('/circulations/:id',circulationController.singleData);
router.put('/circulations/:id/return',multer().none(),circulationController.returned);
router.put('/circulations/:id/pay',multer().none(),circulationController.payFine);
router.post('/circulations',multer().none(),circulationController.store);


module.exports = router;