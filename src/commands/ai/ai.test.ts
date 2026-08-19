import {defaultConfigValues, LexConfig} from '../../LexConfig.js';
import {callAIService} from '../../utils/aiService.js';
import {aiFunction} from './ai.js';

vi.mock('../../utils/aiService.js', () => ({
  callAIService: vi.fn()
}));
vi.mock('../../utils/log.js', () => ({
  log: vi.fn()
}));

describe('aiFunction', () => {
  const originalConfig = LexConfig.config;

  beforeEach(() => {
    vi.clearAllMocks();
    LexConfig.config = {
      ...defaultConfigValues,
      ai: {
        ...defaultConfigValues.ai,
        provider: 'openai'
      }
    };
    vi.spyOn(LexConfig, 'parseConfig').mockResolvedValue(undefined);
    (callAIService as MockedFunction<typeof callAIService>).mockResolvedValue('AI response');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    LexConfig.config = originalConfig;
  });

  it('applies provider and model overrides for optimization tasks', async () => {
    const result = await aiFunction({
      model: 'custom-model',
      prompt: 'Review the build',
      provider: 'anthropic',
      task: 'optimize'
    });

    expect(LexConfig.parseConfig).toHaveBeenCalled();
    expect(LexConfig.config.ai).toEqual(expect.objectContaining({
      model: 'custom-model',
      provider: 'anthropic'
    }));
    expect(callAIService).toHaveBeenCalledWith(
      expect.stringContaining('suggest optimization improvements'),
      false
    );
    expect(result).toEqual({response: 'AI response'});
  });

  it('omits file context when context is disabled', async () => {
    await aiFunction({
      context: false,
      file: 'missing-file.ts',
      prompt: 'Help with this error',
      task: 'help'
    });

    expect(callAIService).toHaveBeenCalledWith(
      expect.not.stringContaining('===CONTEXT==='),
      false
    );
  });
});
