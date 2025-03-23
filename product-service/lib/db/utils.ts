import { RESERVED_ID_PREFIX } from '../../lib/constants';

export const isReservedId = (id: string): boolean => {
  if (!id.startsWith(RESERVED_ID_PREFIX) || id.length !== RESERVED_ID_PREFIX.length + 2) {
    return false;
  }
  return /^\d{2}$/.test(id.slice(-2));
};

export const getReservedId = (index: number): string => {
  return RESERVED_ID_PREFIX + index.toString().padStart(2, '0');
};

export const cleanString = (input: string): string => {
  return input.replace(/\s+/g, ' ').trim();
};

export const randomCount = () => Math.floor(Math.random() * 100) + 1;

export const randomPrice = () => Number((Math.random() * 100 + 1).toFixed(2));
