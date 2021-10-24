import mongoose from "mongoose";
const { DATABASE_CONNECTION_URI } = process.env;

export default function () {
    return mongoose.connect(DATABASE_CONNECTION_URI!, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}








