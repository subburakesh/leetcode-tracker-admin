import Student from "../model/studentModel.js";
import Submission from "../model/submissionModel.js";
import mongoose from "mongoose";

// Format date helper: YYYY-MM-DD
function toDateKey(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const getOverview = async (req, res) => {
  try {
    const { batch } = req.query;

    // Student filter
    const studentFilter = {};
    if (batch && batch !== "all") {
      studentFilter.batch = parseInt(batch, 10);
    }

    const students = await Student.find(studentFilter);
    const totalStudents = students.length;

    // All distinct batches
    const allBatches = await Student.distinct("batch");
    allBatches.sort((a, b) => b - a);

    // Batch-wise student counts
    const batchStudentCounts = {};
    for (const b of allBatches) {
      batchStudentCounts[b] = await Student.countDocuments({ batch: b });
    }

    const studentIds = students.map((s) => s._id);

    // Fetch submissions for these students
    const submissions = await Submission.find({
      studentId: { $in: studentIds },
    });

    // Unique problems per student
    // Map: studentId -> Set(titleSlug)
    const studentSolvedMap = new Map();
    let overallEasy = 0;
    let overallMedium = 0;
    let overallHard = 0;

    // Batch-wise unique problems count
    // Map: batch -> Set(`${studentId}:${titleSlug}`)
    const batchSolvedSet = {};
    allBatches.forEach((b) => (batchSolvedSet[b] = new Set()));

    // Create a student to batch lookup map
    const studentBatchMap = new Map();
    students.forEach((s) => studentBatchMap.set(s._id.toString(), s.batch));

    submissions.forEach((sub) => {
      const sId = sub.studentId.toString();
      const slug = (sub.titleSlug || sub.title).toLowerCase();
      const diff = (sub.difficulty || "Easy").toLowerCase();

      if (!studentSolvedMap.has(sId)) {
        studentSolvedMap.set(sId, new Map());
      }
      const studentMap = studentSolvedMap.get(sId);
      if (!studentMap.has(slug)) {
        studentMap.set(slug, diff);
        if (diff === "easy") overallEasy++;
        else if (diff === "medium") overallMedium++;
        else if (diff === "hard") overallHard++;
      }

      const sBatch = studentBatchMap.get(sId);
      if (sBatch && batchSolvedSet[sBatch]) {
        batchSolvedSet[sBatch].add(`${sId}:${slug}`);
      }
    });

    let totalProblemsSolved = 0;
    studentSolvedMap.forEach((pMap) => {
      totalProblemsSolved += pMap.size;
    });

    // Batch breakdown summary
    const batchesSummary = allBatches.map((b) => ({
      batch: b,
      totalStudents: batchStudentCounts[b] || 0,
      totalProblemsSolved: batchSolvedSet[b] ? batchSolvedSet[b].size : 0,
    }));

    return res.status(200).json({
      totalStudents,
      totalProblemsSolved,
      totalSubmissions: submissions.length,
      difficultySummary: {
        easy: overallEasy,
        medium: overallMedium,
        hard: overallHard,
        total: overallEasy + overallMedium + overallHard,
      },
      availableBatches: allBatches,
      batchesSummary,
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const getStudentsSummary = async (req, res) => {
  try {
    const { batch, search } = req.query;

    const filter = {};
    if (batch && batch !== "all") {
      filter.batch = parseInt(batch, 10);
    }

    // Always fetch all students in the batch first to determine true ranks
    const students = await Student.find(filter).lean();

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    const studentIds = students.map((s) => s._id);

    // Fetch submissions for all matching students
    const submissions = await Submission.find({
      studentId: { $in: studentIds },
    })
      .sort({ timestamp: -1 })
      .lean();

    // Map: studentId -> { easy, medium, hard, uniqueSlugs: Set, totalSubmissions, lastTimestamp }
    const statsMap = new Map();

    submissions.forEach((sub) => {
      const sId = sub.studentId.toString();
      if (!statsMap.has(sId)) {
        statsMap.set(sId, {
          easy: 0,
          medium: 0,
          hard: 0,
          uniqueSlugs: new Set(),
          totalSubmissions: 0,
          lastSubmission: sub.timestamp,
        });
      }
      const st = statsMap.get(sId);
      st.totalSubmissions++;

      const slug = (sub.titleSlug || sub.title).toLowerCase();
      if (!st.uniqueSlugs.has(slug)) {
        st.uniqueSlugs.add(slug);
        const diff = (sub.difficulty || "Easy").toLowerCase();
        if (diff === "easy") st.easy++;
        else if (diff === "medium") st.medium++;
        else if (diff === "hard") st.hard++;
      }
    });

    const studentsWithStats = students.map((s) => {
      const sId = s._id.toString();
      const st = statsMap.get(sId) || {
        easy: 0,
        medium: 0,
        hard: 0,
        uniqueSlugs: new Set(),
        totalSubmissions: 0,
        lastSubmission: null,
      };

      const totalSolved = st.uniqueSlugs.size;

      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        leetcodeUsername: s.leetcodeUsername || "",
        batch: s.batch,
        regNo: s.regNo || "",
        status: s.status || "active",
        stats: {
          easy: st.easy,
          medium: st.medium,
          hard: st.hard,
          totalSolved,
          totalSubmissions: st.totalSubmissions,
          lastSubmission: st.lastSubmission,
        },
      };
    });

    // Sort by totalSolved descending, then by name
    studentsWithStats.sort((a, b) => {
      if (b.stats.totalSolved !== a.stats.totalSolved) {
        return b.stats.totalSolved - a.stats.totalSolved;
      }
      return a.name.localeCompare(b.name);
    });

    // Assign true rank based on overall sorted position
    const rankedStudents = studentsWithStats.map((s, idx) => ({
      ...s,
      rank: idx + 1,
    }));

    // If search filter is provided, filter the ranked list so students retain their true rank
    let result = rankedStudents;
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      result = rankedStudents.filter((s) => {
        return (
          (s.name || "").toLowerCase().includes(term) ||
          (s.email || "").toLowerCase().includes(term) ||
          (s.regNo || "").toLowerCase().includes(term) ||
          (s.leetcodeUsername || "").toLowerCase().includes(term)
        );
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};

export const getStudentSubmissionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findById(id).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const submissions = await Submission.find({ studentId: id })
      .sort({ timestamp: -1 })
      .lean();

    // 1. Difficulty breakdown (Unique problems)
    const uniqueProblemsMap = new Map();
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    // 2. Submission Heatmap
    const heatmap = {};

    // 3. Language breakdown (Unique problems per language & total submissions)
    // Map: lang -> { easySlugs: Set, medSlugs: Set, hardSlugs: Set, totalSubmissions: 0 }
    const langMap = new Map();

    submissions.forEach((sub) => {
      const slug = (sub.titleSlug || sub.title).toLowerCase();
      const diff = (sub.difficulty || "Easy").toLowerCase();
      const lang = (sub.language || "unknown").toLowerCase().trim();

      // Overall unique problems
      if (!uniqueProblemsMap.has(slug)) {
        uniqueProblemsMap.set(slug, sub);
        if (diff === "easy") easyCount++;
        else if (diff === "medium") mediumCount++;
        else if (diff === "hard") hardCount++;
      }

      // Heatmap
      if (sub.timestamp) {
        const dateKey = toDateKey(sub.timestamp);
        heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
      }

      // Language breakdown
      if (!langMap.has(lang)) {
        langMap.set(lang, {
          language: lang,
          easySet: new Set(),
          mediumSet: new Set(),
          hardSet: new Set(),
          totalSubmissions: 0,
        });
      }
      const lObj = langMap.get(lang);
      lObj.totalSubmissions++;
      if (diff === "easy") lObj.easySet.add(slug);
      else if (diff === "medium") lObj.mediumSet.add(slug);
      else if (diff === "hard") lObj.hardSet.add(slug);
    });

    const languageBreakdown = Array.from(langMap.values()).map((l) => ({
      language: l.language,
      easy: l.easySet.size,
      medium: l.mediumSet.size,
      hard: l.hardSet.size,
      total: l.easySet.size + l.mediumSet.size + l.hardSet.size,
      totalSubmissions: l.totalSubmissions,
    }));

    // Sort languages by total problems solved descending
    languageBreakdown.sort((a, b) => b.total - a.total);

    // 4. Completed programs list (records with problem name, difficulty, language, and date)
    const programsCompleted = submissions.map((sub) => ({
      id: sub._id,
      submissionId: sub.submissionId,
      title: sub.title,
      titleSlug: sub.titleSlug,
      difficulty: sub.difficulty,
      language: sub.language,
      timestamp: sub.timestamp,
    }));

    return res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        leetcodeUsername: student.leetcodeUsername || "",
        batch: student.batch,
        regNo: student.regNo || "",
        status: student.status || "active",
      },
      stats: {
        totalSolved: uniqueProblemsMap.size,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
        totalSubmissions: submissions.length,
      },
      heatmap,
      languageBreakdown,
      programsCompleted,
    });
  } catch (error) {
    return res.status(500).json({ errorMessage: error.message });
  }
};
