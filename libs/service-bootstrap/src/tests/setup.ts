// Mock modules
jest.mock('@abyss/shared-config', () => ({
  loadConfig: jest.fn().mockResolvedValue(undefined),
  getConfig: jest.fn().mockReturnValue({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error'
  })
}));

jest.mock('@abyss/shared-utils', () => ({
  generateCorrelationId: jest.fn(() => 'test-correlation-id'),
  errorHandler: jest.fn((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500).json({ error: err.message });
  }),
  notFoundHandler: jest.fn((req: any, res: any) => {
    res.status(404).json({ error: 'Not found' });
  })
}));

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});