import { model, Schema } from "mongoose";

const Size = new Schema({ name: String });

export default model("Size", Size, "sizes");