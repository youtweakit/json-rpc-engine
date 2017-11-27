'use strict';

module.exports = asMiddleware;

function asMiddleware(engine) {
  return function engineAsMiddleware(req, res, next, end) {
    engine._runMiddlewareDown(req, res, function (err, _ref) {
      var isComplete = _ref.isComplete,
          returnHandlers = _ref.returnHandlers;

      if (err) return end(err);
      if (isComplete) {
        end();
      } else {
        next(function (cb) {
          engine._runReturnHandlersUp(returnHandlers, cb);
        });
      }
    });
  };
}