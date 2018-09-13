"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var gothamjs_1 = require("@nlabs/gothamjs");
var React = __importStar(require("react"));
exports.config = {
    name: 'lex',
    routes: [
        {
            container: 'default',
            path: '/',
            props: {
                topBar: {
                    logo: React.createElement(gothamjs_1.Svg, { name: "gotham", width: 175, height: 50 }),
                    menu: [
                        { label: 'Login', url: '/login' },
                        { label: 'Signup', url: '/signup' }
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
                                image: React.createElement("img", { src: "http://lex.nitrogenlabs.com/img/screenshot-1.png" }),
                                title: 'What is Lex?'
                            }
                        ],
                        footer: {
                            copyright: 'Copyright &copy; 2018 Nitrogen Labs, Inc.',
                            logo: React.createElement(gothamjs_1.Svg, { name: "nl-logo-wh", width: 50, height: 50 }),
                            menu: [
                                {
                                    label: 'Documentation',
                                    menu: [
                                        { label: 'About', url: '/about' },
                                        { label: 'Getting Started', url: '/gettingStarted' },
                                        { label: 'Configuration', url: '/config' },
                                        { label: 'Setup', url: '/setup' },
                                        { label: 'API Reference', url: '/api' }
                                    ]
                                },
                                {
                                    label: 'Community',
                                    menu: [
                                        { label: 'StackOverflow', url: 'http://stackoverflow.com/questions/tagged/lexjs' },
                                        { label: 'Chat', url: 'https://discord.gg/Ttgev58' },
                                        { label: 'Facebook', url: 'https://www.facebook.com/nitrogenlabs' }
                                    ]
                                },
                                {
                                    label: 'More',
                                    menu: [
                                        { label: 'NPM', url: 'https://npmjs.com/@nlabs/gothamjs' },
                                        { label: 'Git', url: 'https://github.com/nitrogenlabs/gotham' }
                                    ]
                                }
                            ]
                        },
                        promoRow: {
                            list: [
                                {
                                    details: 'Bundling your app with Webpack 4!',
                                    image: React.createElement(gothamjs_1.Svg, { name: "webpack-logo", width: 150, height: 150 }),
                                    title: 'Webpack'
                                },
                                {
                                    details: 'Transpile ES-next, Flow and Typescript',
                                    image: React.createElement(gothamjs_1.Svg, { name: "babel-logo", width: 150, height: 150 }),
                                    title: 'Babel'
                                },
                                {
                                    details: 'Unit Test has never been easier.',
                                    image: React.createElement(gothamjs_1.Svg, { name: "jest-logo", width: 150, height: 150 }),
                                    title: 'Jest'
                                }
                            ]
                        },
                        splash: {
                            backgroundImage: './img/bg-image.jpg',
                            backgroundTextColor: '#fff',
                            buttons: [
                                { label: 'Quick Start', url: '/quickStart' },
                                { label: 'API', url: '/api' }
                            ],
                            image: React.createElement("img", { src: "./img/bg-logo.png", height: "350" })
                        },
                        topBar: {
                            logo: React.createElement(gothamjs_1.Svg, { name: "lex-logo-wh", width: 130, height: 130 }),
                            menu: [
                                { label: 'Quick Start', url: '/quickStart' },
                                { label: 'API', url: '/api' },
                                { label: 'Help', url: '/help' }
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
                    { label: 'About', url: '/docs' },
                    { label: 'Getting Started', url: '/docs/gettingStarted' },
                    { label: 'Configuration', url: '/docs/configuration' },
                    { label: 'CLI Options', url: '/docs/cli' },
                    { label: 'Setup', url: '/docs/setup' }
                ]
            }
        }
    ],
    title: 'Lex'
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSw0Q0FBeUQ7QUFDekQsMkNBQStCO0FBR2xCLFFBQUEsTUFBTSxHQUF3QjtJQUN6QyxJQUFJLEVBQUUsS0FBSztJQUNYLE1BQU0sRUFBRTtRQUNOO1lBQ0UsU0FBUyxFQUFFLFNBQVM7WUFDcEIsSUFBSSxFQUFFLEdBQUc7WUFDVCxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFO29CQUNOLElBQUksRUFBRSxvQkFBQyxjQUFHLElBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUk7b0JBQ25ELElBQUksRUFBRTt3QkFDSixFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQzt3QkFDL0IsRUFBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUM7cUJBQ2xDO29CQUNELGNBQWMsRUFBRSxNQUFNO29CQUN0QixvQkFBb0IsRUFBRSxNQUFNO2lCQUM3QjthQUNGO1lBQ0QsTUFBTSxFQUFFO2dCQUNOO29CQUNFLElBQUksRUFBRSxHQUFHO29CQUNULEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUU7NEJBQ1I7Z0NBQ0UsS0FBSyxFQUFFLE9BQU87Z0NBQ2QsT0FBTyxFQUFFLGtUQUFrVDtnQ0FDM1QsS0FBSyxFQUFFLDZCQUFLLEdBQUcsRUFBQyxrREFBa0QsR0FBRztnQ0FDckUsS0FBSyxFQUFFLGNBQWM7NkJBQ3RCO3lCQUNGO3dCQUNELE1BQU0sRUFBRTs0QkFDTixTQUFTLEVBQUUsMkNBQTJDOzRCQUN0RCxJQUFJLEVBQUUsb0JBQUMsY0FBRyxJQUFDLElBQUksRUFBQyxZQUFZLEVBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFJOzRCQUN0RCxJQUFJLEVBQUU7Z0NBQ0o7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