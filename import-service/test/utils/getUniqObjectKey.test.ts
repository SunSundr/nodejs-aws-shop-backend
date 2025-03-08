import { MAX_FILE_NAME_LENGTH } from '../../lib/constants';
import { getUniqObjectKey } from '../../lib/lambda/utils/getUniqObjectKey';

describe('getUniqObjectKey', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should generate a unique object key', () => {
    const originalKey = 'uploaded/file.csv';
    const preKey = 'parsed';
    const result = getUniqObjectKey(originalKey, preKey);

    expect(result).toMatch(/^parsed\/\d+_[a-f0-9]+_file\.csv$/);
  });

  it('should truncate the file name if it exceeds MAX_FILE_NAME_LENGTH', () => {
    const longFileName = 'a'.repeat(MAX_FILE_NAME_LENGTH + 10);
    const originalKey = `uploaded/${longFileName}.csv`;
    const preKey = 'parsed';

    const result = getUniqObjectKey(originalKey, preKey);

    const expectedTruncatedName = longFileName.substring(0, MAX_FILE_NAME_LENGTH);
    expect(result).toMatch(new RegExp(`^${preKey}\\/\\d+_[a-f0-9]+_${expectedTruncatedName}$`));
  });

  it('should throw an error for invalid original key', () => {
    expect(() => getUniqObjectKey('', 'parsed')).toThrow(
      'Invalid object key: original name is missing.',
    );
  });

  it('should throw an error if the generated key is too long', async () => {
    const originalKey = 'uploaded/very_long_file_name.csv';
    const preKey = 'key'.repeat(1024);
    expect(() => getUniqObjectKey(originalKey, preKey)).toThrow(
      'Generated object key is too long.',
    );
  });
});
