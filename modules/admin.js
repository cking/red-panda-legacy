'use strict'

let utils = require('../lib/utils')
let spawn = require('child_process').spawn

class Admin {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$db = deps.db
    this.$bot = deps.bot
    utils.privatify(this)

    for (var k of ['owner', 'mode', 'restart']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  can (user, name) {
    let id = user.id || user

    if (this.$db.owner === id) {
      return true
    }

    this.$db.user = this.$db.user || {}
    if (!this.$db.user[id]) {
      return false;
    }
    return this.$db.user[id][name]
  }

  owner (from, args, reply) {
    if (!this.$db.owner) {
      this.$db.owner = from.id
    }

    return reply('Hey, I am owned by ' + this.$bot.Users.get(this.$db.owner).mention + ', thanks for asking!')
  }

  restart (from, args, reply) {
    if (!this.can(from.id, 'restart')) {
      return reply('I am sorry, you are not allowed to that...')
    }

    reply(':frowning: be right back, I just need to get some :candy:')
    this.$bot.disconnect()
    setTimeout(() => process.exit(1), 1000)
  }

  mode (from, args, reply) {
    if (!this.can(from.id, 'administer user')) {
      return reply('I am sorry, you are not allowed to that...')
    }

    let id = 'all'
    let user = 'everyone'
    let name = ''
    let permission = '+'
    if (args.length === 3) {
      id = args[0]
      name = args[1]
      permission = args[2]
    }
    else if (args.length === 1) {
      name = args[0]
    }
    else if (args[1].length === 1) {
      name = args[0]
      permission = args[1]
    }
    else {
      id = args[0]
      name = args[1]
    }

    if (id !== 'all') {
      user = this.$commander.query(id)
      if (user.length !== 1) {
        return reply(owner.length + ' matches found. please limit search to 1 result')
      }
      id = user[0].id
      user = user[0].username
    }

    permission = permission === '+'

    this.$db.user[id][name] = permission
    reply(user + ' is now ' + (permission? 'allowed': 'forbidden') + ' to use ' + permission)
  }
}

Admin.type = 'class'
Admin.depends = { commander: 1, db: 1, bot: 1 }

module.exports = Admin
