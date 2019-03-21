
//############################################################################################################################//
//  Modules
//############################################################################################################################//

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var httpRequest = require('request');
const indexRouter = require('./routes/index');

const app = express();



const TEMPS_ATTENTE = "http://open.tan.fr/ewp/tempsattente.json/";


//############################################################################################################################//
//  Méthodes GET
//############################################################################################################################//

/**
 *  Méthode permettant de récupérer les différents horaires d'un tram pour un arrêt particulier.
 */
app.get('/schedule/:stop', function (request, response) {

  httpRequest({
    url: TEMPS_ATTENTE + request.params.stop,
    json: true
  }, function (error, result) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(result));
  });

});


//############################################################################################################################//
//  Main
//############################################################################################################################//

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
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
