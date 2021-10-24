import apiDecorator from "./decorator";
import * as controller from "@shop/database/controllers"
import { error, ERROR_CODES } from "@shop/utils/response";

export default [
    apiDecorator(
        "product.add", async (request, response) => {
            const params = request.body;
            const data = await controller.addProduct(params);

            return response.send(data);
        }
    ),

    apiDecorator(
        "product.get", async (request, response) => {
            const data = await controller.getProducts();

            return response.send(data);
        }
    ),

    apiDecorator(
        "product.search", async (request, response) => {
            const { query } = request.body;
            if (!query) return response.send(error(ERROR_CODES.INVALID_PARAMS, "Query does not specified"));

            const data = await controller.searchProduct(query);

            return response.send(data);
        }
    ),

    apiDecorator(
        "product.delete", async (request, response) => {
            const { id } = request.body;
            if (!id) return response.send(error(ERROR_CODES.INVALID_PARAMS, "Incorrect id"));

            const data = await controller.deleteProduct(id);

            return response.send(data);
        }
    )
];
