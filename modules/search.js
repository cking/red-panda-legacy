'use strict'

let utils = require('../lib/utils')
let Promise = require('bluebird')
let requestAsync = Promise.promisify(require('request'))

const WIKIPEDIA = 'https://en.wikipedia.org/w/api.php?format=json&action=query&redirects=true&prop=info&&inprop=url|displaytitle&titles='
const OMDB = 'http://www.omdbapi.com/?v=1&r=json&plot=full&tomatoes=true&t='

class Search {
  constructor(deps) {
    let c = this.$commander = deps.commander
    utils.privatify(this)

    for (var k of ['wiki', 'imdb']) {
      c.registerCommand(k, this[k].bind(this))
    }
  }

  wiki (from, args, reply) {
    let search = args.join(' ')

    requestAsync(WIKIPEDIA + encodeURI(search))
    .then(function (res) {
      let data = JSON.parse(res.body)

      if (data.query.pages[-1]) {
        throw new Error('Wikipedia doesn\'t have an article about ' + search)
      }

      return data.query.pages[Object.keys(data.query.pages)[0]]
    })
    .then(function (page) {
      reply(`**${page.displaytitle}** - ${page.fullurl}`)
    })
    .catch(function (err) {
      reply(`I think I became lost during the search... (*${err.message}*)`)
    })
  }

  imdb (from, args, reply) {
    let search = args.join(' ')

    requestAsync(OMDB + encodeURI(search))
    .then(function (res) {
      let data = JSON.parse(res.body)

      if (data.Error) {
        throw new Error('IMDb doesn\'t have an article about ' + search)
      }

      return data
    })
    .then(function (movie) {
      reply(`*(${movie.Year})* **${movie.Title}** - http://www.imdb.com/title/${movie.imdbID}/
Rated: ${movie.Rated} | Runtime: ${movie.Runtime} | Awards: ${movie.Awards}
Directory: ${movie.Director} | Writer: ${movie.Writer} | Actors: ${movie.Actors}

${movie.Plot}`)
    })
    .catch(function (err) {
      reply(`I think I became lost during the search... (*${err.message}*)`)
    })
  }
}

Search.type = 'class'
Search.depends = { commander: 1  }

module.exports = Search
