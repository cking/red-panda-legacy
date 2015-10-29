'use strict'

let util = require('util')

exports.privatify = function (o, options) {
  let opts = options || {}
  Object.keys(o).forEach(function (k) {
    if ((opts.prefix || '$') === k[0] || (opts.functions && util.isFunction(o[k]))) {
      Object.defineProperty(o, k, { enumerable: false })
    }
  })
}
