'use strict'

let utils = require('../lib/utils')
let Promise = require('bluebird')
let requestAsync = Promise.promisify(require('request'))

const LODESTONE = 'http://eu.finalfantasyxiv.com/lodestone/'
const XIVSYNC = 'http://xivsync.com/character/get?lodestone='

const XIV_PADS_BASE = 'http://xivpads.com/goto.php?i=search&a=filter&'

class Xiv {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$admin = deps.admin
    utils.privatify(this)

    for (var k of ['xivpad', 'xivchar']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  xivpad (from, args, reply) {
    let type = args.shift()
    let world = args.shift()
    let name = args.join(' ')

    let url = XIV_PADS_BASE + 'p%5Bname%5D=' + encodeURI(name) + '&p%5Bserver%5D=' + encodeURI(world[0].toUpperCase() + world.substr(1).toLowerCase())

    request(url, function (err, res) {
      if (err) {
        return reply ('Sorry, XivPads is not accessable right now...')
      }

      let body = JSON.parse(res.body)

      if (type === 'fc') {
        let data = body.freecompany
        if (data.length === 1) {
          reply(data[0].name + ' http://xivpads.com/?freecompany/' + data[0].id)
        }
        else {
          reply('Could not find your free company on XivPads')
        }
      }
      else {
        let data = body.characters
        if (data.length === 1) {
          reply(data[0].name + ' http://xivpads.com/?profile/' + data[0].id)
        }
        else {
          reply('Could not find your character on XivPads')
        }
      }
    })
  }

  xivchar (from, args, reply) {
    let world = args.shift()
    let name = args.join(' ')
    let url = LODESTONE + 'character/?q=' + encodeURI(name) + '&worldname=' + world[0].toUpperCase() + world.substr(1).toLowerCase()
    // get lodestone search results
    requestAsync(url)

    // get only the relevant section
    .then(function (res) {
      return res.body.substring(res.body.indexOf('<!-- result -->') + 15, res.body.indexOf('<!-- /result -->'))
    })

    // grep the id
    .then(function (body) {
      let parts = body.split('player_name_gold')

      if (parts.length === 2) {
        let id = parts[1].substr(parts[1].indexOf('"', 2) + 1)
        return id.substr(0, id.indexOf('"')).split('/').filter(s => s.length).pop()
      }

      let m = body.match(new RegExp('(\\d+)/">' + name + '<', 'i'))
      if (m) {
        return m[1]
      }

      throw new Error('Could not find your player, found ' + (parts.length - 1) + ' entries instead. Check ' + url)
    })

    // import data to xivsync
    .then(function (id) {
      return requestAsync(XIVSYNC + id)
      .then(function (res) {
        let data = JSON.parse(res.body).data

        if (!data) {
          throw new Error('Your character wasn\'t found on XivPads.com.')
        }

        return data
      })
    })

    // YAAAY we got the raw data!
    .then(function (data) {
      return `**${data.name}** *(${data.title})* of *${data.world}*
**${data.race}** *${data.clan}*
Member of *${data.freeCompany || 'nothing'}*\n` +
        data.classjobs.filter(job => job.level).map(job => `**${job.name}**: ${job.level}`).join(', ') +
        `\n\n${data.portrait}`
    })

    // now reply
    .then(function (message) {
      reply(message)
    })

    // oh noes, somewhere was an error
    .catch(function (err) {
      reply('Oh noes, somewhere was an error! I am terribly sorry :crying_cat_face: *(' + err.message + ')*')
    })
  }
}

Xiv.type = 'class'
Xiv.depends = { commander: 1, admin: 1 }

Xiv.char = function () {
  let xiv = new Xiv({ commander: { registerCommand: () => {} }})
  xiv.xivchar(null, ['cerberus', 'Xi', 'Shi'], console.log.bind(console))
}

module.exports = Xiv
