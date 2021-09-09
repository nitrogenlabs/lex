import {GothamConfiguration, Svg} from '@nlabs/gothamjs';
import * as React from 'react';

// CONFIGURATION
export const config: GothamConfiguration = {
  name: 'lex',
  routes: [
    {
      container: 'default',
      path: '/',
      props: {
        topBar: {
          logo: <Svg name="gotham" width={175} height={50} />,
          menu: [
            {label: 'Login', url: '/login'},
            {label: 'Signup', url: '/signup'}
          ],
          solidTextColor: '#fff',
          transparentTextColor: '#fff'
        }
      },
      routes: [
        {
          path: '/',
          props: {
            features: [
              {
                align: 'right',
                details: 'Lex is a console line execution tool. Works out of the box for any React project, taking care of all your development needs. No need to install unit testing, transpilers, compilers, or even development servers. Install Lex globally and let go of all the grunt work, allowing you focus on coding your app.',
                image: <img src="http://lex.nitrogenlabs.com/images/screenshot-1.png" />,
                title: 'What is Lex?'
              }
            ],
            footer: {
              copyright: 'Copyright &copy; 2018 Nitrogen Labs, Inc.',
              logo: <Svg name="nl-logo-wh" width={50} height={50} />,
              menu: [
                {
                  label: 'Documentation',
                  menu: [
                    {label: 'About', url: '/about'},
                    {label: 'Getting Started', url: '/gettingStarted'},
                    {label: 'Configuration', url: '/config'},
                    {label: 'Setup', url: '/setup'},
                    {label: 'API Reference', url: '/api'}
                  ]
                },
                {
                  label: 'Community',
                  menu: [
                    {label: 'StackOverflow', url: 'http://stackoverflow.com/questions/tagged/lexjs'},
                    {label: 'Chat', url: 'https://discord.gg/Ttgev58'},
                    {label: 'Facebook', url: 'https://www.facebook.com/nitrogenlabs'}
                  ]
                },
                {
                  label: 'More',
                  menu: [
                    {label: 'NPM', url: 'https://npmjs.com/@nlabs/gothamjs'},
                    {label: 'Git', url: 'https://github.com/nitrogenlabs/gotham'}
                  ]
                }
              ]
            },
            promoRow: {
              list: [
                {
                  details: 'Bundling your app with Webpack 4!',
                  image: <Svg name="webpack-logo" width={150} height={150} />,
                  title: 'Webpack'
                },
                {
                  details: 'Transpile ES-next, Flow and Typescript',
                  image: <Svg name="esbuild-logo" width={150} height={150} />,
                  title: 'ESBuild'
                },
                {
                  details: 'Unit Test has never been easier.',
                  image: <Svg name="jest-logo" width={150} height={150} />,
                  title: 'Jest'
                }
              ]
            },
            splash: {
              backgroundImage: './images/bg-image.jpg',
              backgroundTextColor: '#fff',
              buttons: [
                {label: 'Quick Start', url: '/quickStart'},
                {label: 'API', url: '/api'}
              ],
              image: <img src="./images/bg-logo.png" height="350" />
            },
            topBar: {
              logo: <Svg name="lex-logo-wh" width={130} height={130} />,
              menu: [
                {label: 'Quick Start', url: '/quickStart'},
                {label: 'API', url: '/api'},
                {label: 'Help', url: '/help'}
              ]
            }
          },
          title: 'Welcome',
          view: 'home'
        }
      ]
    },
    {
      container: 'menu',
      exact: false,
      path: '/docs',
      routes: [
        {
          path: '/docs',
          props: {
            external: './about.md'
          },
          title: 'About Lex',
          view: 'markdown'
        },
        {
          path: '/docs/cli',
          props: {
            external: './cli.md'
          },
          title: 'CLI Options',
          view: 'markdown'
        },
        {
          path: '/docs/configuration',
          props: {
            external: './configuration.md'
          },
          title: 'Configuration',
          view: 'markdown'
        },
        {
          path: '/docs/gettingStarted',
          props: {
            external: './gettingStarted.md'
          },
          title: 'Getting Started',
          view: 'markdown'
        },
        {
          path: '/docs/setup',
          props: {
            external: './setup.md'
          },
          title: 'Setup',
          view: 'markdown'
        }
      ],
      sideBar: {
        menu: [
          {label: 'About', url: '/docs'},
          {label: 'Getting Started', url: '/docs/gettingStarted'},
          {label: 'Configuration', url: '/docs/configuration'},
          {label: 'CLI Options', url: '/docs/cli'},
          {label: 'Setup', url: '/docs/setup'}
        ]
      }
    }
  ],
  title: 'Lex'
};
