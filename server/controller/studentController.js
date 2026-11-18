import Student from "../model/studentModel.js";

export const getStudents = async (req, res) => {
  try {
    const { status, batch, search } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (batch && batch !== "all") {
      filter.batch = parseInt(batch, 10);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { regNo: regex },
        { leetcodeUsername: regex },
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.status(200).json(student);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, email, leetcodeUsername, batch, regNo, status } = req.body;

    if (!name || !email || !batch) {
      return res
        .status(400)
        .json({ message: "Name, email, and batch are required." });
    }

    const existingStudent = await Student.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this email already exists." });
    }

    const newStudent = new Student({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      leetcodeUsername: leetcodeUsername ? leetcodeUsername.trim() : "",
      batch: parseInt(batch, 10),
      regNo: regNo ? regNo.trim() : "",
      status: status || "active",
    });

    const savedStudent = await newStudent.save();
    return res.status(201).json(savedStudent);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, leetcodeUsername, batch, regNo, status } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (email && email.toLowerCase().trim() !== student.email) {
      const emailExists = await Student.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "Email is already in use by another student." });
      }
      student.email = email.toLowerCase().trim();
    }

    if (name !== undefined) student.name = name.trim();
    if (batch !== undefined) student.batch = parseInt(batch, 10);
    if (leetcodeUsername !== undefined)
      student.leetcodeUsername = leetcodeUsername.trim();
    if (regNo !== undefined) student.regNo = regNo.trim();
    if (status !== undefined) student.status = status;

    const updatedStudent = await student.save();
    return res.status(200).json(updatedStudent);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};
