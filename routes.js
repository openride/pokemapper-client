import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import Hello from './components/Hello';


const Sup = () => (
  <p>sup dawg</p>
);


export default (
  <Router history={browserHistory}>
    <Route path="/" component={Hello} />
    <Route path="/sup" component={Sup} />
  </Router>
);
