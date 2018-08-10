import {Gotham} from '@nlabs/gothamjs';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {config} from './config';

// Render initial ReactJS code
ReactDOM.render(<Gotham config={config} />, document.getElementById('app'));
