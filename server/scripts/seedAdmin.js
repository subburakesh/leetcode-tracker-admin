
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Admin from "../model/adminModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const username = "rakesh";
        const password = "subburakesh";
        const name = "Subbu Rakesh";

        const existingAdmin = await Admin.findOne({ username });

        if (existingAdmin) {
            console.log("Admin already exists!");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = new Admin({
            name,
            username,
            password: hashedPassword
        });

        await admin.save();

        console.log("Initial admin created successfully!");
        console.log("Username:", username);

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
