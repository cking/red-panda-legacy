'use strict'

let winston = require('winston')
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  level: 'silly',
	colorize: true,
	timestamp: true
})

function log() {
  return winston
}

log.type = 'factory'

module.exports = log
