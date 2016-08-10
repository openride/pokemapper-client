import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import Hello from './components/Hello';
import Privacy from './components/Privacy';


export default (
  <Router history={browserHistory}>
    <Route path="/" component={Hello} />
    <Route path="/privacy" component={Privacy} />
  </Router>
);
