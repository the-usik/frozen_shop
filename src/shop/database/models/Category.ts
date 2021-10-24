import { model, Schema } from "mongoose";

const Category = new Schema({
    name_ru: String,
    name_en: String
});

export default model("Category", Category, "types");