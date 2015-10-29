'use strict'

let semver = require('semver')

// check if we have at least node 4.0
let nv = process.versions.node
if (!semver.satisfies(nv, '>=4')) {
  console.error('your node version is to old, please update to at least node v4')
}

let forever = require('forever-monitor')
let bot = forever.start('app.js', {
  max: 3,
  silent: false,
  args: ['--harmony-proxies'],
  parser: function (command, args) {
    // reorder args
    args.push(args.shift())

    // call original parser
    return forever.Monitor.parseCommand(command, args)
  }
})
