'use strict'

let fs = require('fs')
let path = require('path')
let util = require('util')

let modules = require('./modules')
let dm = require('node-dm')
Object.keys(modules).forEach(m => dm.provide(m, modules[m].type, modules[m], modules[m].depends || []))

class App {
  constructor(deps) {
    this.$bot = deps.bot
    this.$config = deps.config
    this.$log = deps.log
  }

  run () {
    this.$log.info('starting...')
    return dm.resolve(dm.object.apply(null, this.$config.modules)).then(() => this.$log.info('all modules registered!'))
  }
}

dm.class('app', App, { bot: 1, config: 1, log: 1 })
dm.resolve({ app: 1 }).then(function (deps) {
  return deps.app.run()
})

.catch(function (ex) {
  console.error(ex.stack)
  process.exit(666)
})
