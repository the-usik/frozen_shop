import { Query } from "mongoose"

export const normalizeProduct = <T>(product: Query<T, T | any>): Promise<any> => {
    return product
        .populate("category")
        .populate("sizes")
        .exec();
}