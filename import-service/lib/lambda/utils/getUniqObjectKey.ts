import crypto from 'crypto';
import { MAX_FILE_NAME_LENGTH } from '../../constants';

export function getUniqObjectKey(originalKey: string, preKey: string): string {
  const originalName = originalKey.split('/').pop();
  if (!originalName) {
    throw new Error('Invalid object key: original name is missing.');
  }

  const truncatedName =
    originalName.length > MAX_FILE_NAME_LENGTH
      ? originalName.substring(0, MAX_FILE_NAME_LENGTH)
      : originalName;

  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(originalName).digest('hex');
  const newObjectKey = `${preKey}/${timestamp}_${hash}_${truncatedName}`;

  if (Buffer.from(newObjectKey).length > 1024) {
    throw new Error('Generated object key is too long.');
  }

  return newObjectKey;
}
