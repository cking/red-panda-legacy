'use strict'

let utils = require('../lib/utils')
let request = require('request')

class Vote {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$db = deps.db
    this.$bot = deps.bot
    this.$admin = deps.admin
    utils.privatify(this)

    this.$db.vote = this.$db.vote || {}

    for (var k of ['vote_create', 'vote_list', 'vote_delete', 'vote', 'vote_results']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  vote_create (from, args, reply) {
    if (!this.$admin.can(from.id, 'administer vote')) {
      return reply('I am sorry, you are not allowed to that...')
    }

    if (args < 4) {
      return reply('Please make sure to get the right amount of parameters')
    }

    let id = args.shift()
    let question = args.shift()

    if (this.$db.vote[id]) {
      return reply('There is already a voting with the id ' + id)
    }

    this.$db.vote[id] = {
      owner: from.id,
      question: question,
      answers: args.map(function (v) { return { text: v } })
    }

    reply('Alright, I registered "' + id + '" with ' + args.length + ' answers.')
  }

  vote_delete (from, args, reply) {
    if (!this.$admin.can(from.id, 'administer vote')) {
      return reply('I am sorry, you are not allowed to that...')
    }

    delete this.$db.vote[args[0]]
    reply('Alright, I deleted that voting...')
  }

  vote_list (from, args, reply) {
    let ids = Object.keys(this.$db.vote)

    reply('I currently know of ' + ids.length + ' votings:\n' + ids.join(', ') + '\nTo get details, use ?vote ID')
  }

  vote (from, args, reply) {
    let id = args.shift()
    let vote = this.$db.vote[id]

    if (!vote) {
      return reply('I am sorry, I didn\'t find ' + id)
    }

    if (!args.length) {
      reply(this.$bot.Users.get(vote.owner).username + ' asks **' + vote.question + '**\n' + vote.answers.map((v, i) => '*[' + i + ']* ' + v.text).join('\n') + '\nPlease use __?vote ' + id + ' NUMBER__ to cast your vote')
    }
    else {
      if (!this.$admin.can(from.id, 'vote')) {
        return reply('I am sorry, you are not allowed to that...')
      }

      let votee = from.id
      if (!vote.answers[args[0]]) {
        return reply('I am sorry, answer not found...')
      }

      let changed = false
      vote.answers.forEach(function (answer) {
        if (!answer.votes) {
          answer.votes = []
        }
        var idx = answer.votes.indexOf(votee)
        if (idx >= 0) {
          answer.votes.splice(idx, 1)
          changed = true
        }
      })

      vote.answers[args[0]].votes.push(votee)
      //this.$db.vote[id] = vote

      if (!changed) {
        reply('Your vote has been saved')
      }
      else {
        reply('Your vote has been changed')
      }
    }
  }

  vote_results (from, args, reply) {
    if (!this.$admin.can(from.id, 'vote results')) {
      return reply('I am sorry, you are not allowed to that...')
    }
    let vote = this.$db.vote[args[0]]

    if (!vote) {
      return reply('I think ' + args[0] + ' went missing...')
    }

    // first count all votes
    let votes = vote.answers.reduce((p, c) => p + c.votes.length, 0)
    reply(this.$bot.Users.get(vote.owner).username + ' asks **' + vote.question + '**\n' + vote.answers.map((v, i) => '*[' + i + ']* ' + v.text + ' (' + (Math.round(v.votes.length / votes * 10000) / 100) + '%)').join('\n'))
  }
}

Vote.type = 'class'
Vote.depends = { commander: 1, admin: 1, db: 1, bot: 1 }

module.exports = Vote
