'use strict'

let fs = require('fs')
let path = require('path')
let yaml = require('js-yaml')
let util = require('util')
let Proxy = require('harmony-proxy')

function db(deps) {
  let p = path.join(__dirname, '..', 'data.yml')

  let data = fs.existsSync(p)? yaml.safeLoad(fs.readFileSync(p)): {}
  let save = function save() {
    deps.log.debug('saving changes to disc...')
    fs.writeFileSync(p, yaml.safeDump(data))
  }
  setInterval(save, 60000)

  return data
}

db.type = 'factory'
db.depends = { log: 1 }

module.exports = db
