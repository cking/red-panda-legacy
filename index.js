'use strict'

let semver = require('semver')

// check if we have at least node 4.0
let nv = process.versions.node
if (!semver.satisfies(nv, '>=4')) {
  console.error('your node version is to old, please update to at least node v4')
}

// check for proxies
if (typeof Proxy === 'undefined') {
  console.error('proxies are not enabled, restarting script with --harmony-proxies')
  let spawn = require('child_process').spawn
  let p = spawn(process.argv.shift(), ['--harmony-proxies'].concat(process.execArgv, process.argv), { stdio: 'inherit' })
  p.on('exit', process.exit)
}
else {
  // now run myself :)
  require('./app')
}
