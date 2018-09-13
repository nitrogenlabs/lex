import webpack from 'webpack';
import clean from 'rimraf';

// import {getSubDirsSync} from './utils/getSubDirsSync';
import {directoryContains} from './utils/directoryContains';

const successCases = ['basic']; // getSubDirsSync(`${__dirname}/successCases`);
const errorCases = []; // getSubDirsSync(`${__dirname}/errorCases`);

describe('Success cases', () => {
  successCases.forEach((successCase) => {
    describe(successCase, () => {
      // afterEach((done) => {
      //   clean(`${__dirname}/successCases/${successCase}/actualOutput`, done);
      // });

      it('generates the expected HTML files', (done) => {
        const webpackConfig = require(`./successCases/${successCase}/webpack.config.js`);

        webpack(webpackConfig, (webpackError) => {
          if(webpackError) {
            console.error('Webpack Error:', webpackError);
            return done(webpackError);
          }

          const caseDir = `${__dirname}/successCases/${successCase}`;
          const expectedDir = `${caseDir}/expectedOutput/`;
          const actualDir = `${caseDir}/actualOutput/`;

          directoryContains(expectedDir, actualDir, (dirError, result) => {
            if(dirError) {
              console.error('Directory Contains Error:', dirError);
              return done(dirError);
            }

            expect(result).toBe(true);
            done();
          });
        });
      });
    });
  });
});

describe('Error cases', () => {
  errorCases.forEach((errorCase) => {
    describe(errorCase, () => {
      beforeEach((done) => {
        clean(`${__dirname}/errorCases/${errorCase}/actualOutput`, done);
      });

      it('generates the expected error', () => {
        const webpackConfig = require(`./errorCases/${errorCase}/webpack.config.js`);
        // const expectedError = require(`./errorCases/${errorCase}/expectedError.js`);

        console.log('errorCase', errorCase);
        // const runWebpack = () => webpack(webpackConfig, (err) => {
        // console.log('err', err);
        // expect(err).toBe(new Error(expectedError));
        // const actualError = stats.compilation.errors[0].toString().split('\n')[0];
        // done();
        // });

        expect(() => webpack(webpackConfig, () => {})).toThrow(Error);
      });
    });
  });
});
