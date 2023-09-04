require("dotenv").config({});
/**
 * Archivo para la gestión global de los datos de configuación de la App.
 */

export const PORT =
  typeof process.env.PORT !== "undefined" ? process.env.PORT : 3000;
export const NODE_ENV =
  typeof process.env.NODE_ENV !== "undefined"
    ? process.env.NODE_ENV
    : "production";
export const SEED_API =
  typeof process.env.SEED_API !== "undefined" ? process.env.SEED_API : "";
export const MONGO_URI =
  typeof process.env.MONGO_URI !== "undefined" ? process.env.MONGO_URI : "";
export const MONGO_DATABASE =
  typeof process.env.DATABASE !== "undefined" ? process.env.DATABASE : "";
export const DB_DATABASE =
  typeof process.env.DB_DATABASE !== "undefined" ? process.env.DB_DATABASE : "";
export const DB_HOST =
  typeof process.env.DB_HOST !== "undefined" ? process.env.DB_HOST : "";
export const DB_USER =
  typeof process.env.DB_USER !== "undefined" ? process.env.DB_USER : "";
export const DB_PWD =
  typeof process.env.DB_PWD !== "undefined" ? process.env.DB_PWD : "";
export const DB_PORT =
  typeof process.env.DB_PORT !== "undefined"
    ? parseInt(process.env.DB_PORT)
    : 3306;
export const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
export const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
export const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || "";
export const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || "";

export default {
  PORT,
  NODE_ENV,
  SEED_API,
  MONGO_URI,
  MONGO_DATABASE,
  DB_DATABASE,
  DB_HOST,
  DB_USER,
  DB_PWD,
  DB_PORT,
  ZOHO_CLIENT_SECRET,
  ZOHO_CLIENT_ID,
  ZOHO_REFRESH_TOKEN,
  ZOHO_ACCOUNTS_URL,
};
