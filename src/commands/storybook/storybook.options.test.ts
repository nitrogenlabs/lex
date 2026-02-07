import {StorybookOptions} from './storybook.js';

vi.mock('execa');
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('storybook.options tests', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('StorybookOptions interface', () => {
    it('should accept all valid options', () => {
      const options: StorybookOptions = {
        cliName: 'CustomCLI',
        config: './.storybook',
        open: true,
        port: 6007,
        quiet: false,
        static: true,
        variables: '{"DEBUG": true}',
        verbose: true
      };

      expect(options.cliName).toBe('CustomCLI');
      expect(options.config).toBe('./.storybook');
      expect(options.open).toBe(true);
      expect(options.port).toBe(6007);
      expect(options.quiet).toBe(false);
      expect(options.static).toBe(true);
      expect(options.variables).toBe('{"DEBUG": true}');
      expect(options.verbose).toBe(true);
    });

    it('should accept partial options', () => {
      const options: StorybookOptions = {
        quiet: true
      };

      expect(options.quiet).toBe(true);
      expect(options.cliName).toBeUndefined();
      expect(options.config).toBeUndefined();
      expect(options.open).toBeUndefined();
      expect(options.port).toBeUndefined();
      expect(options.static).toBeUndefined();
      expect(options.variables).toBeUndefined();
      expect(options.verbose).toBeUndefined();
    });

    it('should accept empty options object', () => {
      const options: StorybookOptions = {};

      expect(options.cliName).toBeUndefined();
      expect(options.config).toBeUndefined();
      expect(options.open).toBeUndefined();
      expect(options.port).toBeUndefined();
      expect(options.quiet).toBeUndefined();
      expect(options.static).toBeUndefined();
      expect(options.variables).toBeUndefined();
      expect(options.verbose).toBeUndefined();
    });
  });

  describe('option types', () => {
    it('should accept string for cliName', () => {
      const options: StorybookOptions = {
        cliName: 'TestCLI'
      };

      expect(typeof options.cliName).toBe('string');
    });

    it('should accept string for config', () => {
      const options: StorybookOptions = {
        config: './custom-storybook'
      };

      expect(typeof options.config).toBe('string');
    });

    it('should accept boolean for open', () => {
      const options: StorybookOptions = {
        open: true
      };

      expect(typeof options.open).toBe('boolean');
    });

    it('should accept number for port', () => {
      const options: StorybookOptions = {
        port: 6007
      };

      expect(typeof options.port).toBe('number');
    });

    it('should accept boolean for quiet', () => {
      const options: StorybookOptions = {
        quiet: false
      };

      expect(typeof options.quiet).toBe('boolean');
    });

    it('should accept boolean for static', () => {
      const options: StorybookOptions = {
        static: true
      };

      expect(typeof options.static).toBe('boolean');
    });

    it('should accept string for variables', () => {
      const options: StorybookOptions = {
        variables: '{"NODE_ENV": "development"}'
      };

      expect(typeof options.variables).toBe('string');
    });

    it('should accept boolean for verbose', () => {
      const options: StorybookOptions = {
        verbose: true
      };

      expect(typeof options.verbose).toBe('boolean');
    });
  });

  describe('option combinations', () => {
    it('should handle development server options', () => {
      const options: StorybookOptions = {
        open: true,
        port: 6007,
        quiet: false
      };

      expect(options.open).toBe(true);
      expect(options.port).toBe(6007);
      expect(options.quiet).toBe(false);
      expect(options.static).toBeUndefined();
    });

    it('should handle static build options', () => {
      const options: StorybookOptions = {
        quiet: false,
        static: true
      };

      expect(options.static).toBe(true);
      expect(options.quiet).toBe(false);
      expect(options.open).toBeUndefined();
      expect(options.port).toBeUndefined();
    });

    it('should handle configuration options', () => {
      const options: StorybookOptions = {
        config: './.storybook',
        variables: '{"STORYBOOK_THEME": "dark"}'
      };

      expect(options.config).toBe('./.storybook');
      expect(options.variables).toBe('{"STORYBOOK_THEME": "dark"}');
    });

    it('should handle quiet mode with all options', () => {
      const options: StorybookOptions = {
        cliName: 'TestCLI',
        config: './.storybook',
        open: true,
        port: 6007,
        quiet: true,
        static: false,
        variables: '{"DEBUG": true}'
      };

      expect(options.quiet).toBe(true);
      expect(options.cliName).toBe('TestCLI');
      expect(options.config).toBe('./.storybook');
      expect(options.open).toBe(true);
      expect(options.port).toBe(6007);
      expect(options.static).toBe(false);
      expect(options.variables).toBe('{"DEBUG": true}');
    });
  });

  describe('option validation', () => {
    it('should accept valid port numbers', () => {
      const validPorts = [3000, 6006, 6007, 8080, 9000];

      validPorts.forEach((port) => {
        const options: StorybookOptions = {port};

        expect(options.port).toBe(port);
      });
    });

    it('should accept valid JSON strings for variables', () => {
      const validJsonStrings = [
        '{}',
        '{"DEBUG": true}',
        '{"NODE_ENV": "development", "STORYBOOK_THEME": "dark"}',
        '{"PORT": 6007, "OPEN": true}'
      ];

      validJsonStrings.forEach((variables) => {
        const options: StorybookOptions = {variables};

        expect(options.variables).toBe(variables);
      });
    });

    it('should accept valid config paths', () => {
      const validPaths = [
        './.storybook',
        './storybook',
        './config/storybook',
        '/absolute/path/to/storybook'
      ];

      validPaths.forEach((config) => {
        const options: StorybookOptions = {config};

        expect(options.config).toBe(config);
      });
    });
  });
});