'use strict'

let utils = require('../lib/utils')
let Promise = require('bluebird')
let MovieDB = require('moviedb')
let ms = require('ms')
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
    let year = null
    if (args[0] === '-y') {
      args.shift()
      year = args.shift()
    }
    let search = args.join(' ')

    this.$mdb.searchMultiAsync({
      query: search,
      include_adult: false,
      year: year
    })
    .bind(this)
    .then(function (res) {
      if (res.total_results === 0) {
        throw new Error('IMDb doesn\'t have an article about ' + search)
      }

      let movie = res.results.find(m => m.media_type !== 'person')

      return Promise.all([
        this.$mdb[movie.media_type + 'InfoAsync']({ id: movie.id }),
        this.$mdb[movie.media_type + 'VideosAsync']({ id: movie.id }),
        movie.media_type
      ])
    })
    .then(function (info) {
      let movie = info[0]
      let message = `*(${movie.release_date || (movie.first_air_date + ' - ' + movie.last_air_date)})* **${movie.title || movie.name}**`
      if (movie.tagline) {
        message += ' - ' + movie.tagline
      }

      message += '\nRuntime: ' + ms(ms((movie.runtime || movie.episode_run_time[0])+'m')) + ' | '
      if (movie.imdb_id) {
        message += `IMDb: http://www.imdb.com/title/${movie.imdb_id}/`
      }
      else {
        message += `TMDb: http://www.themoviedb.org/${info[2]}/${movie.id}`
      }

      let movies = info[1].results.filter(m => m.site === 'YouTube')
      if (movies.length) {
        message += ' | Video: https://youtu.be/' + movies[Math.floor(Math.random() * movies.length)].key
      }

      message += '\n\n' + movie.overview

      reply(message)
    })
    .catch(function (err) {
      reply(`I think I became lost during the search... *(${err.message})*`)
    })
  }
}

Search.type = 'class'
Search.depends = { commander: 1, config: 1 }

module.exports = Search
