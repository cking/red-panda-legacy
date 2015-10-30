'use strict'

let utils = require('../lib/utils')
let Promise = require('bluebird')
let MovieDB = require('moviedb')
let requestAsync = Promise.promisify(require('request'))

const WIKIPEDIA = 'https://en.wikipedia.org/w/api.php?format=json&action=query&redirects=true&prop=info&&inprop=url|displaytitle&titles='
const OMDB = 'http://www.omdbapi.com/?v=1&r=json&plot=full&tomatoes=true&t='

class Search {
  constructor(deps) {
    let c = this.$commander = deps.commander
    this.$mdb = Promise.promisifyAll(MovieDB(deps.config.search.tmdb))
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

    this.$mdb.searchMovieAsync({
      query: search,
      include_adult: true,
    })
    .bind(this)
    .then(function (res) {
      if (res.total_results === 0) {
        throw new Error('IMDb doesn\'t have an article about ' + search)
      }

      return Promise.all([
        this.$mdb.movieInfoAsync({ id: res.results[0].id }),
        this.$mdb.movieVideosAsync({ id: res.results[0].id })
      ])
    })
    .then(function (info) {
      let movie = info[0]
      let message = `*(${movie.release_date})* **${movie.title}**`
      if (movie.tagline) {
        message += ' - ' + movie.tagline
      }

      message += `\nRuntime: ${ ms(ms(movie.runtime+'m')) } | IMdb: http://www.imdb.com/title/${movie.imdb_id}/`

      let movies = info[1].results.filter(m => m.site === 'YouTube')
      if (movies.length) {
        message += ' | Video: https://youtu.be/' + movies[Math.floor(Math.random() * movies.length)].key
      }

      message += '\n\n' + movie.overview

      reply(message)
    })
    .catch(function (err) {
      reply(`I think I became lost during the search... (*${err.message}*)`)
    })
  }
}

Search.type = 'class'
Search.depends = { commander: 1, config: 1 }

module.exports = Search
