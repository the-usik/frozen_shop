import { join as joinPath } from "path";


export const PRODUCT_IMAGE_MIN_WIDTH = 480;
export const PRODUCT_IMAGE_MIN_HEIGHT = 640;

export const DATA_FOLDER_PATH = joinPath(process.cwd(), "data");
export const UPLOAD_FOLDER_PATH = joinPath(DATA_FOLDER_PATH, "uploads");
export const CITIES_FILEPATH = joinPath(DATA_FOLDER_PATH, "cities.json");
export const BOT_SESSIONS_PATH = joinPath(DATA_FOLDER_PATH, "bot_sessions.json");
