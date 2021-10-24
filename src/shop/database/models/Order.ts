import { model, Schema } from "mongoose";

const Order = new Schema({
    products: [{
        product_id: { type: Schema.Types.ObjectId, ref: "Product" },
        product_size_id: { type: Schema.Types.ObjectId, ref: "ProductSize" },
        count: Number,
        price: Schema.Types.Decimal128
    }],
    user: { type: Schema.Types.ObjectId, ref: "User" },
    delivery: {
        email: String,
        full_name: String,
        phone_number: String,
        order_index: Number,
        subject: String,
        address: {
            city: String,
            street: String,
            home: String,
            flat: String
        }
    },
    date: Date,
    price: Schema.Types.Decimal128
});

export default model("Order", Order, "orders");