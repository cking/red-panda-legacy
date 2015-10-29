'use strict'

let fs = require('fs')
let path = require('path')
let yaml = require('js-yaml')

function config(deps) {
  let p = path.join(__dirname, '..', deps.pkg.name + '.yml')
  // load config
  if (!fs.existsSync(p)) {
    return {}
  }
  else {
    return yaml.safeLoad(fs.readFileSync(p))
  }
}

config.depends = { pkg: true }
config.type = 'factory'

module.exports = config
