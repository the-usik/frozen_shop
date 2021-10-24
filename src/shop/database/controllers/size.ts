import { Size } from "../models"

export const getSizes = () => {
    return Size.find();
}

export const getSizeNames = async () => {
    const sizes = await getSizes();
    return sizes.map(size => size.get("name"));
}