'use strict';

var promiseToCallback = require('promise-to-callback');

module.exports = createAsyncMiddleware;

function createAsyncMiddleware(asyncMiddleware) {
  return function (req, res, next, end) {
    var nextHandlerOnDone = null;
    var finishedPromise = asyncMiddleware(req, res, getNextPromise);
    promiseToCallback(finishedPromise)(function (err) {
      // async middleware ended
      if (nextHandlerOnDone) {
        // next handler was called - complete nextHandler
        nextHandlerOnDone(err);
      } else {
        // next handler was not called - complete middleware
        end(err);
      }
    });

    function getNextPromise() {
      return new Promise(function (resolve) {
        next(function (cb) {
          nextHandlerOnDone = cb;
          resolve();
        });
      });
    }
  };
}