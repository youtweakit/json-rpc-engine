'use strict';

var getUniqueId = require('./getUniqueId');

module.exports = createIdRemapMiddleware;

function createIdRemapMiddleware() {
  return function (req, res, next, end) {
    var originalId = req.id;
    var newId = getUniqueId();
    req.id = newId;
    res.id = newId;
    next(function (done) {
      req.id = originalId;
      res.id = originalId;
      done();
    });
  };
}