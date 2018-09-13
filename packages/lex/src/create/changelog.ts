import execa from 'execa';
import fs from 'fs';
import capitalize from 'lodash/capitalize';
import isEmpty from 'lodash/isEmpty';
import {DateTime} from 'luxon';
import path from 'path';

import {createSpinner, log} from '../utils';

export const createChangelog = async ({cliName, config, outputFile = 'changelog.tmp.md', quiet}): Promise<number> => {
  // Spinner
  const spinner = createSpinner(quiet);

  // Configure git cli options
  const gitOptions: string[] = [
    'log',
    '-3',
    '--pretty=format:{"authorName": "%an", "authorEmail": "%ae", "hashShort": "%h", "hashFull": "%h", "tag": "%D", "date": %ct, "subject": "%s","comments": "%b"}[lex_break]'
  ];

  // Run git
  try {
    const git = await execa('git', gitOptions, {
      encoding: 'utf-8'
    });

    if(!git.status) {
      const {stdout} = git;
      const entries: string[] = stdout.split('[lex_break]').filter((item) => !!item);
      const gitJSON = JSON.parse(`[${entries.join(',')}]`);
      const headerPattern: RegExp = /^(\w*)(?:\(([\w\$\.\-\* ]*)\))?\: (.*)$/;
      const commitContent = {};
      let version: string = 'Unreleased';

      gitJSON.forEach((item) => {
        const {comments, authorEmail, authorName, date, hashFull, hashShort, tag} = item;
        const formatDate: string = DateTime.fromMillis(date).toFormat('DDD');

        if(!isEmpty(tag)) {
          const refs = tag.split(', ');
          const updatedVersion: string = refs.reduce((ref: string, tagItem: string) => {
            let updatedRef: string = ref;

            if(updatedRef === '' && tagItem.includes('tag: v')) {
              updatedRef = tagItem.replace('tag: v', '').trim();
            }

            return updatedRef;
          }, '');

          if(!isEmpty(updatedVersion)) {
            version = updatedVersion;
            commitContent[version] = {date: formatDate, version: updatedVersion};
          }
        }

        const subjectLines: string[] = comments.split('\n');

        if(!commitContent[version]) {
          commitContent[version] = {};
        }

        commitContent[version].list = subjectLines.reduce((list, nextLine: string) => {
          const formatLine: string = nextLine.trim();
          const matches = formatLine.match(headerPattern);

          if(matches) {
            const itemType: string = capitalize(matches[1]);
            const itemScope: string = matches[2];
            const itemDetails: string = matches[3];
            const details = {
              authorEmail,
              authorName,
              details: `${itemType} ${itemDetails}`,
              hashFull,
              hashShort
            };

            if(!list[itemScope]) {
              list[itemScope] = [];
            }

            list[itemScope].push(details);
          }

          return list;
        }, {});
      });

      const formatLog: string = Object.keys(commitContent).reduce((content: string, versionKey: string) => {
        const {date, list = {}, version} = commitContent[versionKey];
        const formatScopes: string[] = Object.keys(list);
        let updatedContent: string = content;

        updatedContent += `\n## ${version} (${date})\n`;

        formatScopes.forEach((scopeName: string) => {
          const scopeList = list[scopeName];
          updatedContent += `\n### ${scopeName}\n\n`;

          scopeList.forEach((changes) => {
            const {authorEmail, authorName, details, hashFull, hashShort} = changes;
            const {gitUrl} = config;
            let hash: string = `#${hashShort}`;

            if(!isEmpty(gitUrl)) {
              let commitPath: string = 'commits';

              if(gitUrl.includes('github.com')) {
                commitPath = 'commit';
              }

              hash = `[#${hashShort}](${gitUrl}/${commitPath}/${hashFull})`;
            }

            updatedContent += `  * ${details} ([${authorName}](mailto:${authorEmail}) in ${hash})\n`;
          });
        });

        return updatedContent;
      }, '# Changes\n');

      const logFile: string = path.join(process.cwd(), outputFile);
      fs.writeFileSync(logFile, formatLog);
      spinner.succeed('Git change log complete!');
    } else {
      spinner.fail('Failed1 generating change.log!');
    }

    // Kill process
    return git.status;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed2 generating change.log!');

    // Kill process
    return 1;
  }
};
