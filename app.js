var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
var app = express();
const cors = require('cors');

//import router
const bookRouter = require('./app/book/router');
const categoryRouter = require('./app/category/router');
const rackRouter = require('./app/rack/router');
const operatorRouter = require('./app/operator/router');
const memberRouter = require('./app/member/router');
const userRouter = require('./app/user/router');
const authRouter = require('./app/auth/router');
const logRouter = require('./app/log-circulation/router');
const circulationRouter = require('./app/circulation/router');
const bookingRouter = require('./app/booking/router');

//import middleware
const {decodeToken} = require('./app/auth/middleware');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());


//gunakan router
app.use(cors());
app.use(decodeToken);
app.use('/auth',authRouter);
app.use('/api',bookRouter);
app.use('/api',categoryRouter);
app.use('/api',rackRouter);
app.use('/api',operatorRouter);
app.use('/api',memberRouter);
app.use('/api',userRouter);
app.use('/api',logRouter);
app.use('/api',circulationRouter);
app.use('/api',bookingRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('404')
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
