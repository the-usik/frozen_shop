import { model, Schema } from "mongoose";

const DEFAULT_NUMBER_TYPE = { type: Number, default: 0 };
const ProductSize = new Schema({
    size: { type: String, required: true },
    purchased: DEFAULT_NUMBER_TYPE,
    count: DEFAULT_NUMBER_TYPE,
});

export default model("ProductSize", ProductSize, "product_size");