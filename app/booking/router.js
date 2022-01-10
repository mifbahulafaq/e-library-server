const router = require('express').Router();
const multer = require('multer');

const bookingController = require('./controller');

router.get('/bookings',bookingController.index);
router.put('/bookings/:detail_id/process',multer().none(),bookingController.process);
router.delete('/bookings/:detail_id',bookingController.remove);
router.post('/bookings',multer().none(),bookingController.store);


module.exports = router;