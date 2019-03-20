
//  Modules
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', function (request, response, next) {
  response.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
});

module.exports = router;