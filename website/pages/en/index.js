/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + "/siteConfig.js");

function imgUrl(img) {
  return siteConfig.baseUrl + "img/" + img;
}

function docUrl(doc, language) {
  return siteConfig.baseUrl + "docs/" + (language ? language + "/" : "") + doc;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? language + "/" : "") + page;
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: "_self"
};

const SplashContainer = props => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = props => (
  <div className="projectLogo">
    <img src={props.img_src} alt={siteConfig.title} title={siteConfig.title} />
  </div>
);

const PromoSection = props => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

class HomeSplash extends React.Component {
  render() {
    let language = this.props.language || "";
    return (
      <SplashContainer>
        <Logo img_src={imgUrl("bg-logo.png")} />
        <div className="inner">
          <PromoSection>
            <Button href={docUrl("gettingStarted.html", language)}>Quick Start</Button>
            <Button href={docUrl("cli.html", language)}>API</Button>
            <Button href={siteConfig.repoUrl}>GitHub</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const Block = props => (
  <Container
    padding={["bottom", "top"]}
    id={props.id}
    background={props.background}>
    <GridBlock align={props.align} contents={props.children} layout={props.layout} />
  </Container>
);

const Features = props => (
  <Block align="center" layout="fourColumn">
    {[
      {
        content: "Bundling your app with Webpack 4!",
        image: imgUrl("webpack-logo.svg"),
        imageAlign: "top",
        title: "Webpack"
      },
      {
        content: "Transpile ES-next, Flow and Typescript",
        image: imgUrl("babel-logo.svg"),
        imageAlign: "top",
        title: "Babel"
      },
      {
        content: "Unit Test has never been easier.",
        image: imgUrl("jest-logo.svg"),
        imageAlign: "top",
        title: "Jest"
      }
    ]}
  </Block>
);

const FeatureCallout = props => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{ textAlign: "center" }}>
    <h2>Feature Callout</h2>
    <MarkdownBlock>These are features of this project</MarkdownBlock>
  </div>
);

const LearnHow = props => (
  <Block align="left" background="light">
    {[
      {
        content: "Lex is a console line execution tool. Works out of the box for any React project, taking care of all your development needs. No need to install unit testing, transpilers, compilers, or even development servers. Install Lex globally and let go of all the grunt work, allowing you focus on coding your app.",
        image: imgUrl("screenshot-1.png"),
        imageAlign: "right",
        title: "What is Lex?"
      }
    ]}
  </Block>
);

class Index extends React.Component {
  render() {
    let language = this.props.language || "";

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Features />
          <LearnHow />
        </div>
      </div>
    );
  }
}

module.exports = Index;
