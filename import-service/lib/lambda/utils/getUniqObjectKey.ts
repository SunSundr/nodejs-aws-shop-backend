import crypto from 'crypto';
import { MAX_FILE_NAME_LENGTH } from '../../constants';

export function getUniqObjectKey(originalKey: string, preKey: string): string {
  const originalName = originalKey.split('/').pop();
  if (!originalName) {
    throw new Error('Invalid object key: original name is missing.');
  }

  const cleanName = originalName.replace(/^\d+_[a-f0-9]+_/, '');

  const truncatedName =
    cleanName.length > MAX_FILE_NAME_LENGTH
      ? cleanName.substring(0, MAX_FILE_NAME_LENGTH)
      : cleanName;

  const timestamp = Date.now();
  const newObjectKey = `${preKey}/${timestamp}_${truncatedName}`;
  const hash = crypto.createHash('md5').update(newObjectKey).digest('hex');
  const finalObjectKey = `${preKey}/${timestamp}_${hash}_${truncatedName}`;

  if (Buffer.from(finalObjectKey).length > 1024) {
    throw new Error('Generated object key is too long.');
  }

  return finalObjectKey;
}
