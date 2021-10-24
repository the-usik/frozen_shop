import { normalizeProduct } from "@shop/database/helpers";
import { Product } from "@shop/database/models";
import { calculatePercent, formatPrice } from "@utils/helpers";

import { Router } from "express";

const main = Router();

const helpers = { formatPrice, calculatePercent };

const checkAuth = (request, response, next) => {
    if (!request.session.auth) return response.redirect("/");
    return next();
}

main.get("/", async (request, response) => {
    let { sex, search, for_sale } = request.query;
    let query: any = {};
    let isSearch = sex ?? search ?? for_sale;

    if (for_sale) {
        query.for_sale = true;
    }

    if (sex && Number(sex) >= 0 && Number(sex) <= 2) {
        query.sex = Number(sex);
    }

    if (search) {
        query.$text = {
            $search: search
        };
    }

    let products = Product.find(query);
    let normalizedProduct = await normalizeProduct(products);

    response.render("index", {
        config: {
            ajax: false
        },
        isSearch,
        products: normalizedProduct,
        helpers
    });
});

main.post("/", async (request, response) => {
    let products = Product.find();
    let normalizedProduct = await normalizeProduct(products);

    response.render("index", {
        config: {
            ajax: true
        },
        search: Boolean(false),
        products: normalizedProduct,
        helpers
    });
})

main.get("/product/:productId", async (request, response, next) => {
    try {
        let { productId } = request.params;

        if (!productId)
            throw new Error(`Product with "${productId}" is't found!`);

        const productQuery = Product.findById(productId)
        const product = await normalizeProduct(productQuery);
        if (!product)
            throw new Error("Product not found!");

        const childsQuery = Product.find({ name: product?.name })
        const childs = await normalizeProduct(childsQuery);

        response.render("product", {
            config: {
                ajax: false
            },
            childs,
            product, helpers
        });
    } catch (error) {
        return next();
    }
});

main.get("/cart", checkAuth, async (request: any, response) => {
    const { session } = request;
    if (!session.cart) session.cart = [];

    response.render("cart", { cart: session.cart });
})

main.get("/payment", checkAuth, async (request: any, response) => {
    console.log(request.session);
    if (!request.session.order) return response.redirect("/");

    response.render("payment", { order: request.session.order });
})

export default main;