import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import Hello from './components/Hello';


export default (
  <Router history={browserHistory}>
    <Route path="/" component={Hello} />
  </Router>
);
