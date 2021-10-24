import { FILE_TYPES } from "@shop/utils/constants";
import { uploadPhotoFromUrl } from "@shop/utils/helpers";
import { error, ERROR_CODES, ok } from "@shop/utils/response";
import { ObjectId } from "mongoose";
import { normalizeProduct } from "../helpers";
import { Category, Product, ProductSize, Size } from "../models";

interface IProductSize {
    name: string;
    count: number;
}

interface IAddProductOptions {
    name: string;
    description: string;

    category: string;

    imageUrls: string[];

    sex?: number;

    forSale?: boolean;
    discount?: number;

    color: string;

    price: number;
    sizes: IProductSize[];
}

const uploadProductImages = async (imageUrls: string[]) => {
    const promises = imageUrls.map(uploadPhotoFromUrl);
    const response: any[] = await Promise.all(promises);
    return response.filter(data => data);
}

const insertProductSize = async ({ count, name }: IProductSize) => {
    const findResult = await Size.findOne({ name });
    if (!findResult) throw new Error("The specified size does not exists!");

    const productSize = new ProductSize({
        size: findResult.get("name"),
        count
    });

    return productSize.save();
}

export const addProduct = async (productOptions: IAddProductOptions) => {
    try {
        if (!productOptions.imageUrls.length) return error(ERROR_CODES.INVALID_PARAMS, "The images isn't set!");

        const files = await uploadProductImages(productOptions.imageUrls);
        const findTypeResult = await Category.findOne({
            $or: [
                { name_ru: productOptions.category },
                { name_en: productOptions.category }
            ]
        });

        if (!findTypeResult) return error(ERROR_CODES.INVALID_PARAMS, "The specified type does not exists!");

        const insertedProductSizes = await Promise.all(productOptions.sizes.filter(a => a).map(insertProductSize));
        const normalizedImages = files.map(
            ({ filename }) => ({ type: FILE_TYPES.PATH, filename })
        );

        const productBuilderParams = {
            name: productOptions.name.trim(),
            description: productOptions.description.trim(),
            price: Math.floor(productOptions.price),
            sex: productOptions.sex || 0,
            category: findTypeResult._id,
            color: productOptions.color,
            sizes: insertedProductSizes.map(productSize => productSize._id),
            images: normalizedImages,
            for_sale: productOptions.forSale || false,
            discount: Math.floor(productOptions.discount || 0)
        }

        const insertedProduct = new Product(productBuilderParams);
        await insertedProduct.save();

        return ok(insertedProduct._id);
    } catch ({ message }) {
        return error(ERROR_CODES.FAILED, message as string);
    }
}

export const deleteProduct = async (id: ObjectId) => {
    try {
        await Product.deleteOne({ _id: id });
        return ok(id);
    } catch ({ message }: any) {
        return error(ERROR_CODES.FAILED, message as string);
    }
}

export const getProducts = async () => {
    try {
        const productQuery = Product.find();
        const products = await normalizeProduct(productQuery);

        return ok({
            count: products.length,
            items: products
        });
    } catch ({ message }: any) {
        return error(ERROR_CODES.FAILED, message as string);
    }
}


export const getProductById = async (id: any) => {
    try {
        const productFindResult = Product.findById(id);
        const product = await normalizeProduct(productFindResult);

        return ok(product);
    } catch ({ message }: any) {
        return error(ERROR_CODES.FAILED, message as string);
    }
}

export const searchProduct = async (query: string) => {
    try {
        const productQuery = Product.find({
            $text: {
                $search: query.trim()
            }
        });

        const products = await normalizeProduct(productQuery);

        return ok({
            count: products.length,
            items: products
        });
    } catch ({ message }: any) {
        return error(ERROR_CODES.FAILED, message as string);
    }
}
