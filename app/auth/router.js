const router = require('express').Router();
const multer = require('multer');
const passport = require('passport');
let LocalStrategy = require('passport-local').Strategy

const authController = require('./controller');

passport.use(new LocalStrategy({usernameField: 'email'},authController.localStrategy))

router.post('/login',multer().none(),authController.login);
router.delete('/logout',authController.logout);
router.get('/me',authController.me);


module.exports = router;