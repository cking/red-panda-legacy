'use strict'

let path = require('path')
let util = require('util')
let utils = require('../lib/utils')

class Commander {
  constructor(deps) {
    this.$bot = deps.bot
    this.$log = deps.log
    this.$prefix = deps.config.commander.prefix
    this.$commands = {}
    utils.privatify(this)

    this.$bot.Dispatcher.on('MESSAGE_CREATE', this.$command.bind(this))
  }

  $command (data) {
    this.$log.silly('new incoming message')

    let message = data.message
    let line = message.content

    // ignore myself and file uploads
    if (message.author.id == this.$bot.User.id || message.attachments.length) {
      this.$log.silly('it is my own or has a file, ignoring')
      return
    }
    // am i mentioned?
    else if (this.$bot.User.isMentioned(message)) {
      this.$log.silly('i am mentioned')
      line = line.replace(this.$bot.User.mention, '')
    }
    // is this a prefixed Message?
    else if (line.indexOf(this.$prefix) === 0) {
      this.$log.silly('this is a command')
      line = line.substr(this.$prefix.length)
    }
    // is this a regular message?
    else if (!message.isPrivate) {
      this.$log.silly('this is a normal message, ignoring')
      return
    }

    this.$log.silly('dispatching command')
    return this.executeCommand(message.author, line, message.channel.sendMessage.bind(message.channel))
  }

  executeCommand (from, line, reply) {
    // split line in a shell compatible format
    let args = line.match(/("(?:[^"])+"|'(?:[^'])+'|(?:\\ |\S)+)/g).map(function (arg) {
      // remove quotes of arguments
      if ((arg[0] === '"' && arg[arg.length - 1] === '"') || (arg[0] === '\'' && arg[arg.length - 1] === '\'')) {
        return arg.substr(1, arg.length - 2)
      }

      return arg
    })

    let command = args.shift().toLowerCase()
    if (this.$commands[command]) {
      this.$log.silly('executing ' + command + ' with ' + args.length + ' arguments')
      this.$commands[command](from, args, reply)
    } else {
      this.$log.silly('command ' + command + ' not found')
    }
  }

  registerCommand (command, cb) {
    if (arguments.length !== 2) {
      throw new Error('you need to specify the command and a callback')
    }
    if (this.$commands[command]) {
      throw new Error(command + ' already defined')
    }
    if (!util.isFunction(cb)) {
      throw new Error(command + ' doesn\'t have a valid callback')
    }

    this.$log.debug('registered command ' + command)
    this.$commands[command] = cb
  }

  query (query, server) {
    let m = query.match(/^<@(\d+)>$/)
    if (m) {
      return [this.$bot.Users.get(m[1])]
    }
    else {
      let list

      switch (query[0]) {
        // text channel
        case '#':
          if (server) {
            list = server.textChannels
          }
          else {
            list = this.$bot.Channels.filter(c => c.type === 'text')
          }
          break

        // vocie channel
        case '*':
          if (server) {
            list = server.voiceChannels
          }
          else {
            list = this.$bot.Channels.filter(c => c.type === 'voice')
          }
          break

        // voice channel
        case '*':
          if (server) {
            list = server.voiceChannels
          }
          else {
            list = this.$bot.Channels.filter(c => c.type === 'voice')
          }
          break

        // user
        case '@':
          if (server) {
            list = server.members
          }
          else {
            list = this.$bot.Users
          }
          break

        // guild / server
        case '!':
          list = this.Guilds
          break
      }

      return list? []: list.filter(e => (e.name || e.username).toLowerCase().indexOf(term.substr(1).toLowerCase()) >= 0)
    }
  }
}

Commander.type = 'class'
Commander.depends = { bot: 1, config: 1, log: 1 }

module.exports = Commander
