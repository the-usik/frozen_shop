import { UPLOAD_FOLDER_PATH } from "@utils/constants";
import multerBuilder from "multer";
import apiDecorator from "./decorator";

const multerOptions = { dest: UPLOAD_FOLDER_PATH }
const multer = multerBuilder(multerOptions);

export default [
    apiDecorator(
        "photo.upload", multer.single("photo"), (request: any, response) => {
            response.send(request.file);
        }
    ),
];