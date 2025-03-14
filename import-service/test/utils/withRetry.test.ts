import { withRetry } from '../../lib/lambda/utils/withRetry';

jest.useFakeTimers();

describe('withRetry', () => {
  let fn: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    fn = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should return the result if the function succeeds on the first try', async () => {
    fn.mockResolvedValue('success');
    await expect(withRetry(fn)).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry the function if it fails and eventually succeed', async () => {
    fn.mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');

    const promise = withRetry(fn, 2, 1000);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    jest.advanceTimersByTime(2000);
    await Promise.resolve();

    await expect(promise).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should retry the maximum number of times and then throw an error', async () => {
    fn.mockRejectedValue(new Error('fail'));

    const promise = withRetry(fn, 2, 1000);
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    jest.runOnlyPendingTimers();

    await expect(promise).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
  });
});
