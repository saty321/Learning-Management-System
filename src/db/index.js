import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log(process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`\n Database is connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed: ", error);
        process.exit(1);
    }
}

export default connectDB;