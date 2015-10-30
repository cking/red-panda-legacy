'use strict'

let utils = require('../lib/utils')
let request = require('request')

class Gimmicks {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$admin = deps.admin
    this.$db = deps.db
    this.$bot = deps.bot
    utils.privatify(this)

    this.$db.define = this.$db.define || { channels: [], terms: {} }
    this.$bot.Dispatcher.on('MESSAGE_CREATE', this.messageCreate.bind(this))

    for (var k of ['avatar', 'cookie', 'say', 'define', 'define_cleverclock']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  messageCreate (data) {
    let msg = data.message
    if (msg.author.id === this.$bot.User.id || this.$db.define.channels.indexOf(msg.channel_id) < 0) {
      return
    }

    for (let k in this.$db.define.terms) {
      if (msg.content.match(new RegExp(`(^|\\s)${k}(\s|$)`, 'i'))) {
        this.define(msg.author, k, msg.channel)
      }
    }
  }

  avatar (from, args, reply) {
    let owner = from
    if (args.length) {
      owner = this.$commander.query(args[0])
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
    if (this.$admin.can(from.id, 'say')) {
      reply(args.join(' '))
    }
  }

  define (from, args, reply) {
    let term = this.$db.define.terms[args[0]]
    if (args.length === 1) {
      if (term) {
        reply(`*Sorry to disturb you, but in my opinion* **${args[0]}** ${term}`)
      }
      else {
        reply('*I tried, I really tried :crying_cat_face: I can\'t find out what ' + args[0] + ' means...*')
      }
    }

    if (!this.$admin.can(from.id, 'define')) {
      reply(`I am sorry ${from.username}, I am afraid i can't let you do that.`)
    }

    let keyword = args.shift()
    let definition = args.join(' ')

    this.$db.define.terms[keyword] = definition
    reply(`Thank you for teaching me senpai! From now on **${keyword}** ${definition}`)
  }

  define_cleverclock (from, args, reply) {
    if (!this.$admin.can(from.id, 'define cleverclock')) {
      reply(`I am sorry ${from.username}, I am afraid i can't let you do that.`)
    }

    let channel = from.channel
    if (args.length) {
      channel = this.$commander.queryOne(args.shift())
      if (channel.channels) {
        channel = this.$commander.queryOne(args.shift(), channel)
      }
    }

    let idx = this.$db.define.channels.indexOf(channel.id)
    if (idx < 0) {
      reply(`From now on, I shall correct all people in #${channel.name} on ${channel.guild.name} *evil laugh*`)
       this.$db.define.channels.push(channel.id)
    }
    else {
      reply(`Oh, did I annoy you too much? I will stop then...`)
      this.$db.define.channels.splice(idx, 1)
    }
  }
}

Gimmicks.type = 'class'
Gimmicks.depends = { commander: 1, admin: 1, db: 1, bot: 1 }

module.exports = Gimmicks
