const router = require('express').Router();
const multer = require('multer');

const logController = require('./controller');

router.get('/circulation-logs',logController.index);
router.delete('/circulation-logs/:id',logController.remove);

module.exports = router;