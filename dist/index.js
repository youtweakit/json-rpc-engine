'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var async = require('async');
var JsonRpcError = require('json-rpc-error');

var RpcEngine = function () {
  function RpcEngine() {
    _classCallCheck(this, RpcEngine);

    this._middleware = [];
  }

  //
  // Public
  //

  _createClass(RpcEngine, [{
    key: 'push',
    value: function push(middleware) {
      this._middleware.push(middleware);
    }
  }, {
    key: 'handle',
    value: function handle(req, cb) {
      // batch request support
      if (Array.isArray(req)) {
        async.map(req, this._handle.bind(this), cb);
      } else {
        this._handle(req, cb);
      }
    }

    //
    // Private
    //

  }, {
    key: '_handle',
    value: function _handle(req, cb) {
      // create response obj
      var res = {
        id: req.id,
        jsonrpc: req.jsonrpc
        // process all middleware
      };this._runMiddleware(req, res, function (err) {
        if (err) return cb(err);
        // return response
        cb(null, res);
      });
    }
  }, {
    key: '_runMiddleware',
    value: function _runMiddleware(req, res, onDone) {
      var _this = this;

      // flow
      async.waterfall([function (cb) {
        return _this._runMiddlewareDown(req, res, cb);
      }, checkForCompletion, function (returnHandlers, cb) {
        return _this._runReturnHandlersUp(returnHandlers, cb);
      }], onDone);

      function checkForCompletion(_ref, cb) {
        var isComplete = _ref.isComplete,
            returnHandlers = _ref.returnHandlers;

        // fail if not completed
        if (!('result' in res) && !('error' in res)) {
          return cb(new Error('RpcEngine - response has no error or result'));
        }
        if (!isComplete) {
          return cb(new Error('RpcEngine - nothing ended request'));
        }
        // continue
        return cb(null, returnHandlers);
      }

      function runReturnHandlers(returnHandlers, cb) {
        async.eachSeries(returnHandlers, function (handler, next) {
          return handler(next);
        }, onDone);
      }
    }

    // walks down stack of middleware

  }, {
    key: '_runMiddlewareDown',
    value: function _runMiddlewareDown(req, res, onDone) {
      // for climbing back up the stack
      var allReturnHandlers = [];
      // flag for stack return
      var isComplete = false;

      // down stack of middleware, call and collect optional allReturnHandlers
      async.mapSeries(this._middleware, eachMiddleware, completeRequest);

      // runs an individual middleware
      function eachMiddleware(middleware, cb) {
        // skip middleware if completed
        if (isComplete) return cb();
        // run individual middleware
        middleware(req, res, next, end);

        function next(returnHandler) {
          // add return handler
          allReturnHandlers.push(returnHandler);
          cb();
        }
        function end(err) {
          if (err) return cb(err);
          // mark as completed
          isComplete = true;
          cb();
        }
      }

      // returns, indicating whether or not it ended
      function completeRequest(err) {
        if (err) {
          // prepare error message
          res.error = new JsonRpcError.InternalError(err);
          // return error-first and res with err
          return onDone(err, res);
        }
        var returnHandlers = allReturnHandlers.filter(Boolean).reverse();
        onDone(null, { isComplete: isComplete, returnHandlers: returnHandlers });
      }
    }

    // climbs the stack calling return handlers

  }, {
    key: '_runReturnHandlersUp',
    value: function _runReturnHandlersUp(returnHandlers, cb) {
      async.eachSeries(returnHandlers, function (handler, next) {
        return handler(next);
      }, cb);
    }
  }]);

  return RpcEngine;
}();

module.exports = RpcEngine;