'use strict'

var path = require('path')
var request = require('request')

class Forward {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$db = deps.db
    this.$bot = deps.bot
    this.$log = deps.log
    this.$admin = deps.admin
    this.$db.forward = this.$db.forward || {}

    for (var k of ['forward', 'forward_list', 'forward_delete']) {
      c.registerCommand(k, this[k].bind(this))
    }

    this.$bot.Dispatcher.on('MESSAGE_CREATE', this.messageCreate.bind(this))
  }

  messageCreate (data) {
    let msg = data.message
    if (msg.author.id === this.$bot.User.id) {
      return
    }

    let cid = msg.channel_id
    if (this.$db.forward[cid]) {
      let channels = this.$db.forward[cid].map(id => this.$bot.Channels.get(id))
      if (!msg.attachments.length) {
        this.$log.info('forwarding text message ' + msg.content)
        channels.forEach(channel => channel.sendMessage('**' + msg.author.username + '** on ' + msg.guild.name + ' *#' + msg.channel.name + '* wrote:\n' + msg.content))
      }
      else {
        this.$log.info('forwarding file ' + msg.attachments[0].url)
        channels.forEach(function (channel) {
          channel.sendMessage('**' + msg.author.username + '** on ' + msg.guild.name + ' *#' + msg.channel.name + '* uploaded:')
          channel.uploadFile(request(msg.attachments[0].url), msg.attachments[0].filename)
        })
      }
    }
  }

  forward(from, args, reply) {
    if (!this.$admin.can(from.id, 'administer forward')) {
      return reply('I am sorry, I can\'t allow you to do that...')
    }

    // fetch da source channel
    let source = this.$commander.queryOne(args.shift())
    if (source.channels) {
      source = this.$commander.queryOne(args.shift(), source)
    }

    let target = this.$commander.queryOne(args.shift())
    if (target.channels) {
      target = this.$commander.queryOne(args.shift(), target)
    }

    this.$db.forward[source.id] = this.$db.forward[source.id] || []
    if (this.$db.forward[source.id].indexOf(target.id) < 0) {
      this.$db.forward[source.id].push(target.id)
    }

    reply('Messages from #' + source.name + ' of ' + source.guild.name + ' get forwarded to #' + target.name + ' of ' + target.guild.name)
  }

  forward_list(from, args, reply) {
    if (!this.$admin.can(from.id, 'administer forward')) {
      return reply('I am sorry, I can\'t allow you to do that...')
    }

    reply(Object.keys(this.$db.forward).map(function (id) {
      let channel = this.$bot.Channels.get(id)

      return 'Messages from ' + channel.name + ' of ' + channel.guild.name + ' get forwarded to: \n' +
        this.$db.forward[id].map(function (tid) {
          let channel = this.$bot.Channels.get(tid)
          return '- ' + channel.name + ' of ' + channel.guild.name
        }, this).join('\n')
    }, this).join('\n\n'))
  }

  forward_delete(from, args, reply) {
    if (!this.$admin.can(from.id, 'administer forward')) {
      return reply('I am sorry, I can\'t allow you to do that...')
    }

    let source = this.$commander.queryOne(args.shift())
    if (source.channels) {
      source = this.$commander.queryOne(args.shift(), source)
    }

    if (args.length) {
      let target = this.$commander.queryOne(args.shift())
      if (target.channels) {
        target = this.$commander.queryOne(args.shift(), target)
      }

      delete this.$db.forward[source.id][this.$db.forward[source.id].indexOf(target.id)]
      reply('Messages from #' + source.name + ' of ' + source.guild.name + ' won\'t be forwarded to #' + target.name + ' of ' + target.guild.name + ' anymore!')
    }
    else {
      delete this.$db.forward[source.id]
      reply('Messages from #' + source.name + ' of ' + source.guild.name + ' won\'t be forwarded anymore!')
    }
  }
}

Forward.type = 'class'
Forward.depends = { admin: 1, bot: 1, commander: 1, db: 1, log: 1 }

module.exports = Forward
