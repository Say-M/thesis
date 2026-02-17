import { Config } from "@repo/common/models/config";

/**
 * Gets the latest config from the database.
 * Always fetches the most recent config based on createdAt timestamp.
 * @returns The latest config document or null if none exists
 */
export const getLatestConfig = async () => {
  const config = await Config.findOne().sort({ createdAt: -1 }).lean();

  return config;
};

/**
 * Gets a specific config value from the latest config.
 * @param key - The config field name
 * @param defaultValue - Default value if config doesn't exist or field is missing
 * @returns The config value or default
 */
export const getConfigValue = async <T>(
  key: keyof typeof Config.prototype,
  defaultValue: T,
): Promise<T> => {
  const config = await getLatestConfig();
  if (!config) return defaultValue;

  const value = config[key as keyof typeof config];
  return (value !== undefined && value !== null ? value : defaultValue) as T;
};
