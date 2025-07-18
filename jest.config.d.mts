declare namespace _default {
    let displayName: any;
    let testEnvironment: string;
    let moduleFileExtensions: string[];
    let moduleDirectories: string[];
    let moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': string;
        '^execa$': string;
        '^boxen$': string;
        '^chalk$': string;
        '^ora$': string;
        '^latest-version$': string;
        '^compare-versions$': string;
        '.*LexConfig.*': string;
        '.*build\\.js$': string;
        '.*versions\\.js$': string;
        '.*compile\\.js$': string;
        'utils/file\\.js$': string;
        '.*/utils/file\\.js$': string;
        '^(\\.{1,2}/)*utils/file\\.js$': string;
        '.(css|less|scss|sass)$': string;
        '.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': string;
    };
    let rootDir: string;
    let transformIgnorePatterns: string[];
    let setupFilesAfterEnv: string[];
    let transform: {
        '^.+.js$|^.+.jsx$': (string | {
            presets: (string | (string | {
                targets: {
                    node: string;
                };
            })[])[];
        })[];
        '^.+.ts$|^.+.tsx$': (string | {
            presets: (string | (string | {
                targets: {
                    node: string;
                };
            })[])[];
        })[];
    };
    let testRegex: string;
    let collectCoverage: boolean;
    let coverageDirectory: string;
    let coveragePathIgnorePatterns: string[];
    let coverageReporters: string[];
    let verbose: boolean;
}
export default _default;
