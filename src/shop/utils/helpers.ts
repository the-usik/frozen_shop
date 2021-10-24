import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";
const { SERVER_HOST, SERVER_PORT } = process.env;

export const keyMirror = (array = []) => {
    const object: any = {};
    for (let i of array) {
        object[i] = array;
    }
    return object;
}

export const calculateHash = (string) => {
    if (typeof string != "string") return;

    return crypto
        .createHash("sha256")
        .update(string)
        .digest("hex")
}

export const getUploadedFilePath = (filename) => {
    return `/photos/${filename}`;
}

export const uploadPhotoFromUrl = async (url) => {
    try {
        const { data } = await axios.get(url, {
            responseType: "stream"
        });

        const formData = new FormData();
        formData.append("photo", data);

        const response = await axios.post(`http://${SERVER_HOST}:${SERVER_PORT}/api/photo.upload`, formData, {
            headers: formData.getHeaders()
        });

        return response.data;
    } catch (error) {
        return undefined;
    }
}

export const generateString = (length = 8) => {
    return new Array(length)
        .fill(0)
        .map(() => (Math.random() * 0xFFFFF ^ 0).toString(16)).slice(0, length)
        .join("-");
}

export const isLocalRequest = (request) => {
    const ip = request.connection.remoteAddress;
    const host = request.get('host');
    return ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" || ip === "::1" || host.indexOf("localhost") !== -1;
}