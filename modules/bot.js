'use strict'

let Discordie = require('../lib/discordie/lib')

function bot(deps) {
  let bot = new Discordie()
  bot.connect(deps.config.auth)
  return new Promise(resolve => bot.Dispatcher.on('GATEWAY_READY', () => resolve(bot)))
}

bot.depends = { config: true }
bot.type = 'factory'

module.exports = bot
