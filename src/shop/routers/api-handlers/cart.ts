import { getProductById } from "@shop/database/controllers";
import { ProductSize } from "@shop/database/models";
import { generateString } from "@shop/utils/helpers";
import { error, ErrorResponse, ERROR_CODES, ok, OkResponse } from "@shop/utils/response";
import { calculatePercent } from "@utils/helpers";
import apiDecorator from "./decorator";

export default [
    apiDecorator(
        "cart.add", async (request: any, response) => {
            const { session } = request;

            if (!Array.isArray(session.cart))
                session.cart = [];

            const { id, data } = request.body;
            const { size_id: sizeId, count } = data || {};

            if (!id || !data || !sizeId || !count) return response.send(
                error(ERROR_CODES.INVALID_PARAMS, "Invalid params.")
            );

            let responseData;
            try {
                const productResponse = await getProductById(id);
                if ((productResponse as ErrorResponse).error) {
                    return response.send(error(ERROR_CODES.INVALID_PARAMS, "Invalid product id"));
                }
                const product = (productResponse as OkResponse).payload;
                const productSize = await ProductSize.findOne({ _id: sizeId });

                if (Number(count) >= productSize?.get("count")) {
                    throw new Error("Указанное количество превышает кол-во товара на складе");
                }
                
                let similarIndex = session.cart.findIndex(e => e.product._id == id && e.data.productSize._id == sizeId);
                if (similarIndex != -1) {
                    session.cart[similarIndex].data.count += count;
                    session.save();

                    return response.send(ok(true));
                }


                session.cart.push({
                    id: generateString(4),
                    product,
                    data: {
                        productSize, count
                    }
                });
                session.save();

                responseData = ok(product!);
            } catch (e: any) {
                responseData = error(ERROR_CODES.FAILED, e.message);
            }

            response.send(responseData);
        }
    ),

    apiDecorator(
        "cart.get", (request: any, response) => {
            const { session } = request;
            session.cart ??= [];

            response.send(ok(session.cart));
        }
    ),

    apiDecorator(
        "cart.getTotal", (request: any, response) => {
            const cart = request.session.cart;
            const count = cart.reduce((acc, item) => acc += item, 0);
            const total = cart.reduce((acc, item) => {
                const price = (!item.product.for_sale)
                    ? item.product.price
                    : calculatePercent(item.product.price, item.product.discount) * item.data.count;

                return acc += price;
            }, 0);

            return response.send(
                ok({ count, total })
            );
        }
    ),

    apiDecorator(
        "cart.delete", (request: any, response) => {
            const { session } = request;
            const { id } = request.body;
            if (!id) return response.send(
                error(ERROR_CODES.INVALID_PARAMS, "Invalid params")
            );

            const index = session.cart.findIndex(cartItem => cartItem.id == id);
            session.cart.splice(index, 1);
            session.save();

            response.send(ok({ removed: 1 }));
        }
    ),

    apiDecorator("/cart.clear", (request: any, response) => {
        const { session } = request;
        session.cart = [];

        return response.send(ok(true));
    })
];