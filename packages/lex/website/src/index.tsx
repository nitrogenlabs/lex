import {Gotham} from '@nlabs/gothamjs';
import * as React from 'react';
import {createRoot} from 'react-dom/client';

import {config} from './config';

const root = createRoot(document.getElementById('app'));
root.render(<Gotham config={config} />);