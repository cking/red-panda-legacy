'use strict'

let path = require('path')
let util = require('util')
let utils = require('../lib/utils')

class Commander {
  constructor(deps) {
    this.$bot = deps.bot
    this.$log = deps.log
    this.$db = deps.db
    this.$prefix = deps.config.commander.prefix
    this.$commands = {}
    utils.privatify(this)

    this.registerCommand('commands', this.commands.bind(this))
    this.registerCommand('query', this.queryCommand.bind(this))
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

  commands (from, line, reply) {
    reply('Currently, I know the following commands: \n*' + Object.keys(this.$commands).sort().join(', ') + '*\n\nYou can execute the commands, by either prefixing them with "' + this.$prefix + '" or mention me at the start or end of the command')
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

  queryOne (query, server) {
    let res = this.query(query, server)
    if (res.length === 1) {
      return res[0]
    }
    else {
      throw new Error('Please limit the result set to 1 item, found ' + res.length + ' for ' + query)
    }
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
          list = this.$bot.Guilds
          break
      }

      return list? list.filter(e => (e.name || e.username).toLowerCase().indexOf(query.substr(1).toLowerCase()) >= 0): []
    }
  }

  queryCommand (from, args, reply) {
    if (this.$db.owner !== from.id) {
      return reply('I am sorry, I can\'t let you do that...')
    }

    reply(this.query(args[0]).map(e => Object.keys(e).map(k => '**' + k + '**: ' + e[k]).join('\n')).join('\n\n'))
  }
}

Commander.type = 'class'
Commander.depends = { bot: 1, config: 1, log: 1, db: 1 }

module.exports = Commander
