import { ProductSize } from "@shop/database/models";
import Order from "@shop/database/models/Order";
import { error, ERROR_CODES, ok } from "@shop/utils/response";
import { getProductPrice } from "@utils/helpers";
import locale from "@utils/locale";
import apiDecorator from "./decorator";

const order = [
    apiDecorator("order.commit",
        async (request: any, response, next) => {
            const { cart, user } = request.session;
            const { payload } = request.body;

            if (!user) return response.send(
                error(ERROR_CODES.AUTH_FAILED, locale.get("need_auth"))
            );

            if (cart.length < 1) {
                return response.send(error(ERROR_CODES.INVALID_PARAMS, locale.get("cart_empty")))
            }

            if (!payload) return response.send(
                error(ERROR_CODES.INVALID_PARAMS, locale.get("invalid_params"))
            );

            const valid = Boolean(
                payload.email && payload.full_name &&
                payload.phone_number && payload.order_index &&
                payload.subject && payload.address &&
                payload.address?.city && payload.address?.street &&
                payload.address?.home
            );

            if (!valid) {
                return response.send(
                    error(ERROR_CODES.INVALID_PARAMS, locale.get("invalid_params"))
                );
            }

            const products = cart.map(({ product, data }) => {
                return {
                    product_id: product._id,
                    product_size_id: data.productSize,
                    count: data.count,
                    price: getProductPrice(product) * Number(data.count)
                }
            });

            const order = {
                products,
                user: user._id,
                delivery: payload,
                date: Date.now(),
                price: products.reduce((acc, product) => acc += product.price, 0)
            };

            request.session.order = order;
            request.session.save();

            return response.send(ok(order));
        }
    ),
    apiDecorator("order.pay",
        async (request: any, response) => {
            try {
                const { order } = request.session;
                if (!order.products.length)
                    return response.send(
                        error(ERROR_CODES.INVALID_PARAMS, locale.get("invalid_params"))
                    );

                for (let { product_size_id } of order.products) {
                    const filter = {
                        _id: product_size_id,
                        count: { $gt: 0 }
                    };

                    const update = {
                        $inc: { count: -1, purchased: 1 }
                    };

                    await ProductSize.updateOne(filter, update);
                }

                let o = new Order(order);
                o.save();

                delete request.session.order;
                delete request.session.cart;

                return response.send(
                    ok(locale.get("payment_success"))
                );
            } catch (e: any) {
                response.send(
                    error(ERROR_CODES.FAILED, locale.get("payment_error"))
                )
            }
        }
    ),
    apiDecorator("/order.get", async (request: any, response) => {
        try {
            const { user_id } = request.body;
            const filter = user_id ? { user: { _id: user_id } } : {};
            const orders = await Order.find(filter).populate("user");

            return response.send(ok(orders));
        } catch (e: any) {
            response.send(
                error(ERROR_CODES.FAILED, locale.get("unknown_error"))
            )
        }
    })
]

export default order;

