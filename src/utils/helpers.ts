import path from "path";
import { UPLOAD_FOLDER_PATH } from "./constants";

export const calculatePercent = (number: number, percent: number) => {
    return number * (percent / 100);
}

export const checkRange = (number: number, [from, to]: [number, number]) => (
    number >= from && number <= to
);

export const getMediaDirectPath = (filename: string) => {
    return path.join(UPLOAD_FOLDER_PATH, filename);
}
export function formatPrice(price) {
    return `${price.toLocaleString("ru-RU", { useGrouping: true })}\u20BD`.replace(/,/gi, ".")
}

export function getProductPrice(product) {
    return product.for_sale ? product.price - calculatePercent(product.price, product.discount) : product.price;
}