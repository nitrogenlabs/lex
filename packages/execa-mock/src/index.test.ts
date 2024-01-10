jest.mock('child_process', () => ({
  exec: jest.fn()
}));

describe('execa mock', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('initial', async () => {
    expect(true).toBe(true);
  });
});
