export const REFRESH_TOKEN_MAX_AGE = 24 * 60 * 60; // 1 day
export const ACCESS_TOKEN_MAX_AGE = REFRESH_TOKEN_MAX_AGE / 3; // 1/3 of refresh token

export const acceptedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];
