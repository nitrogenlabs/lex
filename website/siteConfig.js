/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config.html for all the possible
// site configuration options.

const siteConfig = {
  baseUrl: '/',
  chatUrl: 'https://discord.gg/Ttgev58',
  cname: '',
  colors: {
    primaryColor: '#824CB2',
    secondaryColor: '#bb8eff'
  },
  copyright: `Copyright © ${new Date().getFullYear()} Nitrogen Labs, Inc.`,
  favicon: 'img/favicon.png',
  fonts: {
    siteFont: ['Open Sans', 'Helvetica']
  },
  footerIcon: 'img/nl-logo-wh.svg',
  gaTrackingId: 'UA-112380475-3',
  headerIcon: 'img/lex-logo-wh.svg',
  headerLinks: [
    {doc: 'gettingStarted', label: 'Quick Start'},
    {doc: 'cli', label: 'API'},
    {label: 'Help', page: 'help'}
  ],
  highlight: {
    theme: 'atom-one-dark'
  },
  npmUrl: 'https://npmjs.com/@nlabs/lex',
  ogImage: 'img/docusaurus.png',
  onPageNav: 'separate',
  organizationName: 'nitrogenlabs',
  projectName: 'lex',
  repoUrl: 'https://github.com/nitrogenlabs/lex',
  scripts: ['https://buttons.github.io/buttons.js'],
  stylesheets: [
    'https://fonts.googleapis.com/css?family=Open+Sans:400,400i,700'
  ],
  tagline: 'DevOps Tool',
  title: 'Lex',
  twitterImage: 'img/docusaurus.png',
  url: 'https://nitrogenlabs.com/lex'
};

module.exports = siteConfig;
