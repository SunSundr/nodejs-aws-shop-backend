import * as fs from 'fs';
import { join } from 'path';
import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import { CacheObject } from '../types';

export const BATCH_DELAY_MS = 120000;

const getCachePath = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/tmp/cache/cache.json';
  }
  const localPath = join(process.cwd(), 'tmp', 'cache', 'cache.json');
  const dir = join(process.cwd(), 'tmp', 'cache');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return localPath;
};

export const serializeHttpResponse = (response: CacheObject) => JSON.stringify(response);
/* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
export const deserializeHttpResponse = (cached: string) => JSON.parse(cached);

export const customKeyv = new Keyv({
  store: new KeyvFile({
    filename: getCachePath(),
    expiredCheckDelay: BATCH_DELAY_MS, // ms, remove expired data in each ms
    writeDelay: 200, // ms, batch write to disk.
  }),
});
