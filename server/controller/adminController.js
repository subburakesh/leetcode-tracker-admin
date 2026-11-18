import Admin from "../model/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Set HTTP-only cookie for secure browser sessions
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const user = {
      id: admin._id,
      name: admin.name,
      username: admin.username,
    };

    return res.status(200).json({
      message: "Login Successful",
      token,
      user,
      authenticated: true,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: error.message,
    });
  }
};

export const adminLogout = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({
    message: "Logged out successfully",
    authenticated: false,
  });
};

export const getMe = async (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        authenticated: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (error) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid or expired token",
    });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ _id: -1 });
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Name, username, and password are required.",
      });
    }

    const normalizedUsername = username.toLowerCase().trim();

    const adminExists = await Admin.findOne({ username: normalizedUsername });
    if (adminExists) {
      return res.status(400).json({ message: "Admin username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name: name.trim(),
      username: normalizedUsername,
      password: hashedPassword,
    });

    const savedAdmin = await newAdmin.save();

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: savedAdmin._id,
        name: savedAdmin.name,
        username: savedAdmin.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (username && username.toLowerCase().trim() !== admin.username) {
      const normalizedUsername = username.toLowerCase().trim();
      const existing = await Admin.findOne({
        username: normalizedUsername,
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Username is already taken by another admin." });
      }
      admin.username = normalizedUsername;
    }

    if (name) {
      admin.name = name.trim();
    }

    const updated = await admin.save();

    return res.status(200).json({
      message: "Admin updated successfully",
      admin: {
        id: updated._id,
        name: updated.name,
        username: updated.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins <= 1) {
      return res.status(400).json({
        message: "Cannot delete the last remaining admin account.",
      });
    }

    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};
