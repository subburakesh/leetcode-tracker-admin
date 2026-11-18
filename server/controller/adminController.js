import Admin from "../model/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
    try {
        const {username, password} = req.body;

        const admin = await Admin.findOne({username});

        if (!admin) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).json({
            message: "Login Successful",
            token
        })
    } catch (error) {
        res.status(500).json({
            errorMessage: error.message
        });
    }
}

export const createAdmin = async (req, res) => {
    try {
        const newAdmin = new Admin(req.body);
        const {username} = newAdmin;

        const adminExists = await Admin.findOne({ username });
        if (adminExists) {
            return res.status(400).json({message: "Admin already exists"});
        }

        const saveAdmin = await newAdmin.save();

        return res.status(200).json(newAdmin);

    } catch (error) {
        return res.status(500).json({errorMessage: error.message});
    }
};