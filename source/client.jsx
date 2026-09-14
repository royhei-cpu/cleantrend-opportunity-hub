import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import App from './catalog-app.js';
hydrateRoot(document.getElementById('app'),<App/>);
