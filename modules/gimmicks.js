'use strict'

let utils = require('../lib/utils')
let request = require('request')

class Gimmicks {
  constructor(deps) {
    let c = this.$commander = deps.commander
    utils.privatify(this)

    for (var k of ['avatar', 'cookie', 'say']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  avatar (from, args, reply) {
    let owner = from
    if (args.length) {
      owner = bot.query(args[0])
      if (owner.length !== 1) {
        return reply(owner.length + ' matches found. please limit search to 1 result')
      }
      else {
        owner = owner[0]
      }
    }

    reply(owner.mention + ' is using ' + owner.avatarURL + ' as an avatar')
  }

  cookie (from, args, reply) {
    request('http://fortunecookieapi.com/v1/cookie', function (err, res) {
      if (err) {
        return reply ('Sorry, I run out of cookies :(')
      }
      let fortune = JSON.parse(res.body)[0]
      reply('*I am sorry, I opened your cookie...*\n\n' + fortune.fortune.message + '\n**Lotto numbers**: ' + fortune.lotto.numbers.join(', '))
    })
  }

  say (from, args, reply) {
    reply(args.join(' '))
  }
}

Gimmicks.type = 'class'
Gimmicks.depends = { commander: 1 }

module.exports = Gimmicks
