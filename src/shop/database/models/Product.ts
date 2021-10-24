import { model, Schema } from "mongoose";

const DEFAULT_EMPTY_STRING_TYPE = { type: String, default: "" };

const Product = new Schema({
    name: { type: String, required: true },
    description: DEFAULT_EMPTY_STRING_TYPE,
    price: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    sex: { type: Number, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    color: { type: String, required: true },
    sizes: [{ type: Schema.Types.ObjectId, ref: "ProductSize" }],
    images: [{
        filename: String,
        type: { type: Number }
    }],
    for_sale: {
        type: Boolean,
        required: false,
        default: false
    },
    discount: {
        type: Number,
        default: 0
    }
});

export default model("Product", Product, "products");