'use strict'

let fs = require('fs')
let path = require('path')
let yaml = require('js-yaml')
let Proxy = require('harmony-proxy')

function db(deps) {
  let p = path.join(__dirname, '..', 'data.yml')

  let data = fs.existsSync(p)? yaml.safeLoad(fs.readFileSync(p)): {}
  let save = function save(data) {
    fs.writeFileSync(p, yaml.safeDump(data))
  }

  return new Proxy(data, {
    set: function (target, property, value) {
      target[property] = value
      save(target)
    },

    deleteProperty: function (target, property) {
      delete target[property]
      save(target)
    }
  })
}

db.type = 'factory'

module.exports = db
