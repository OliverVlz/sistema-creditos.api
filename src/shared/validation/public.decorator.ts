import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator used to define public routes.
 * Use it when authentication is not need.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
