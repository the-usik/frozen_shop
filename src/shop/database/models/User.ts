import { model, Schema } from "mongoose";

const UserModel = new Schema({
    first_name: { type: String, default: "" },
    last_name: { type: String, default: "" },
    middle_name: { type: String, default: "" },
    bdate: Date,
    balance: { type: Schema.Types.Decimal128, default: 500 },
    city: { type: String },
    region: { type: String },
    banned: { type: Boolean, default: false },
    is_admin: { type: Number, default: false },
    login: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" }
});

export default model("User", UserModel, "users");