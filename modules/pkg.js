'use strict'

let path = require('path')

function pkg() {
  return require(path.join(__dirname, '..', 'package.json'))
}

pkg.type = 'factory'

module.exports = pkg
