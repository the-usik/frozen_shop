import product from "./product"
import photo from "./photo"
import city from "./city";
import cart from "./cart";
import order from "./order";

export default [
    ...product, ...photo,
    ...city, ...cart,
    ...order
];