const Koa = require('koa')
const mount = require('koa-mount')
const graphqlHTTP = require('koa-graphql')
const mongoose = require('mongoose')

const { __APIPORT__ } = require('../config')
const { schema, rootValue } = require('./graphql')

mongoose.Promise = Promise
mongoose.connect('mongodb://localhost/torrboard')

const app = new Koa()

app.use(
  mount(
    '/graphql',
    graphqlHTTP({
      schema,
      rootValue,
      graphiql: true,
    }),
  ),
)

app.listen(__APIPORT__, () => console.log(`[TorrBoard API] Listening on ::${__APIPORT__}.`)) // eslint-disable-line no-console
