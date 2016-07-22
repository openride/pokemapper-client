import Hapi from 'hapi'
import vision from 'vision'
import inert from 'inert'
import handlebars from 'handlebars'

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { match, RouterContext } from 'react-router'

import routes from '../routes';
import Hello from '../components/Hello';

const server = new Hapi.Server();

const viewsConfig = {
  engines: {
    html: handlebars,
  },
  relativeTo: __dirname,
  path: 'templates',
};

server
  .register(vision)
  .then(() => server.views(viewsConfig),
        err => console.error('nope', err));

server
  .register(inert)
  .catch(err => console.err('nope', err));

server.connection({
  host: '0.0.0.0',
  port: 4000,
});

server.route({
  method: 'GET',
  path: '/static/{all*}',
  handler: {
    directory: {
      path: 'public',
    },
  },
});

server.route({
  method: 'GET',
  path: '/{all*}',
  handler: (request, reply) =>
    match({ routes, location: request.url.path }, (err, redir, props) => {
      if (err) {
        reply(new Error('Something went wrong'));
      } else if (redir) {
        reply.redirect(redir.pathname + redir.search);
      } else if (props) {
        reply.view('index', Object.assign({
          app: ReactDOMServer.renderToString(<RouterContext {...props} />),
          version: '0.0.2',
          NODE_ENV: 'development',
          FB_APP_ID: '306876449657804',
          API_HOST: 'http://localhost:3000',
        }, process.env));
      } else {
        reply('Not found').code(404);
      }
    }),
});

server
  .start()
  .then(() => console.log('started'),
        err => console.error('failed to start', err));
