/* eslint no-unused-vars: 0 */
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { handleMiddlewareErrors } = require('errors');

const index = require('routes/index');
const users = require('routes/users');
const calendar = require('routes/calendar');

const app = express();


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', index);
app.use('/users/', users);
app.use('/calendar/', calendar);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  const customError = handleMiddlewareErrors(err);
  res.status(customError.status)
    .json({ message: customError.message });
});

module.exports = app;
