import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    leetcodeUsername: {
      type: String,
      trim: true,
      default: "",
    },
    batch: {
      type: Number,
      required: true,
    },
    regNo: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt fields
  }
);

export default mongoose.model("students", studentSchema);
