import React from 'react';
import ReactDOM from 'react-dom';
import Spindle from 'spindle-ui';

import routes from '../routes';

const Root = Spindle('Routes', { view: () => routes });

ReactDOM.render(<Root />, document.getElementById('app'));
