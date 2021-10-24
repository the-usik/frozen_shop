import { model, Schema } from "mongoose";

const Banner = new Schema({
    link: String,
    image: {
        filename: String,
        type: { type: Number }
    }
});

export default model("Banner", Banner, "banners");