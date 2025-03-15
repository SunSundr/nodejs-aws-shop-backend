import { Product, ProductWithoutId, ValidateResult } from '../../db/types';
import { DEFAULT_CATEGORY } from '../../lib/constants';

export function validateProduct<T = Product | ProductWithoutId>(
  body: Partial<Product>,
  verifyId: boolean,
  idMayBeUndefined = false,
): ValidateResult<T> {
  const { id, title, description } = body;
  const price = typeof body.price === 'string' && body.price === '' ? NaN : Number(body.price);
  const count = typeof body.count === 'string' && body.count === '' ? NaN : Number(body.price);

  const isIdValid =
    !verifyId ||
    (verifyId && !idMayBeUndefined && typeof id === 'string' && id.trim() !== '') || // ID is required and must be a non-empty string
    (verifyId &&
      idMayBeUndefined &&
      (id === undefined || (typeof id === 'string' && id.trim() !== ''))); // ID may be undefined or a non-empty string

  const areFieldsValid =
    typeof title === 'string' &&
    title.trim() &&
    typeof description === 'string' &&
    !isNaN(price) &&
    !isNaN(count);

  if (!isIdValid || !areFieldsValid) {
    return { message: 'Invalid input data' };
  }

  if (price < 0 || count < 0) {
    return { message: 'Price and count must be non-negative' };
  }
  const imageURL = body.imageURL;
  if (imageURL !== undefined && typeof imageURL !== 'string' /* empty string allowed */) {
    return { message: 'Invalid imageURL format' };
  }
  const category = body.category;
  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    return { message: 'Invalid category format' };
  }

  return {
    product: {
      ...(verifyId && { id: id || 'none' }),
      category: (category as string) || DEFAULT_CATEGORY,
      title,
      description,
      price,
      count,
      ...(imageURL && { imageURL }),
    } as T,
  };
}
