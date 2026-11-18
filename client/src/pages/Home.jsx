import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Code2,
  Calendar,
  Search,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Flame,
  Award,
  Layers,
  Sparkles,
  X,
  FileCode2,
} from "lucide-react";

// Format date helper
function formatDate(dateInput) {
  if (!dateInput) return "N/A";
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayOnly(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ----------------------------------------------------------------------
// Activity Heatmap Component (LeetCode 3-Month Calendar View)
// ----------------------------------------------------------------------
function SubmissionHeatmap({ heatmapData = {} }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = latest 3 months (Sep, Oct, Nov 2026)

  // Current anchor date (based on latest submission date in data or today)
  const anchorDate = useMemo(() => {
    const dates = Object.keys(heatmapData).filter((k) => heatmapData[k] > 0);
    if (dates.length > 0) {
      dates.sort();
      const latest = new Date(dates[dates.length - 1]);
      if (!isNaN(latest.getTime())) return latest;
    }
    return new Date();
  }, [heatmapData]);

  // Generate the 3 target months based on anchorDate and monthOffset
  const threeMonths = useMemo(() => {
    const result = [];
    const endTarget = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + monthOffset, 1);

    for (let i = 2; i >= 0; i--) {
      const d = new Date(endTarget.getFullYear(), endTarget.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const days = [];
      let monthTotal = 0;

      // Empty padding cells before the first day
      for (let p = 0; p < firstDay; p++) {
        days.push(null);
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(day).padStart(2, "0");
        const dateKey = `${year}-${mm}-${dd}`;
        const count = heatmapData[dateKey] || 0;
        monthTotal += count;
        days.push({
          day,
          dateKey,
          dateObj: new Date(year, month, day),
          count,
          monthName,
        });
      }

      result.push({
        year,
        month,
        monthName,
        days,
        monthTotal,
      });
    }

    return result;
  }, [anchorDate, monthOffset, heatmapData]);

  // Compute stats specifically for this 3-month window
  const { totalSubmissionsIn3M, activeDaysIn3M } = useMemo(() => {
    let subs = 0;
    let days = 0;
    threeMonths.forEach((m) => {
      m.days.forEach((d) => {
        if (d && d.count > 0) {
          subs += d.count;
          days++;
        }
      });
    });
    return { totalSubmissionsIn3M: subs, activeDaysIn3M: days };
  }, [threeMonths]);

  function getLevelClass(count) {
    if (!count || count === 0) return "level-0";
    if (count === 1) return "level-1";
    if (count <= 2) return "level-2";
    if (count <= 4) return "level-3";
    return "level-4";
  }

  const dateRangeLabel = `${threeMonths[0]?.monthName || ""} – ${threeMonths[2]?.monthName || ""}`;

  return (
    <div className="heatmap-card">
      <div className="heatmap-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Submission Activity Heatmap</h3>
            <span className="diff-badge diff-badge-easy" style={{ fontSize: "11px", fontWeight: "600" }}>
              3-Month View
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Daily problem submissions across {dateRangeLabel}.
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Month shift buttons */}
          <div style={{ display: "flex", gap: "4px", background: "#1f2128", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev - 1)}
              style={{ background: "transparent", border: "none", color: "#f3f4f6", padding: "4px 8px", cursor: "pointer", fontSize: "12px", borderRadius: "4px" }}
              title="Previous month"
            >
              ◀ Prev
            </button>
            {monthOffset !== 0 && (
              <button
                type="button"
                onClick={() => setMonthOffset(0)}
                style={{ background: "#282a35", border: "none", color: "#ffa116", padding: "4px 8px", cursor: "pointer", fontSize: "11px", borderRadius: "4px", fontWeight: "600" }}
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev + 1)}
              style={{ background: "transparent", border: "none", color: "#f3f4f6", padding: "4px 8px", cursor: "pointer", fontSize: "12px", borderRadius: "4px" }}
              title="Next month"
            >
              Next ▶
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#f3f4f6" }}>
            <Flame size={16} color="#ffa116" />
            <span><strong>{activeDaysIn3M}</strong> Active Days</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#f3f4f6" }}>
            <Sparkles size={16} color="#00b8a3" />
            <span><strong>{totalSubmissionsIn3M}</strong> Submissions</span>
          </div>
        </div>
      </div>

      {/* 3 Full Month Calendar Cards Grid */}
      <div className="three-month-calendar-grid">
        {threeMonths.map((mObj, idx) => (
          <div key={idx} className="month-card">
            <div className="month-card-header">
              <div className="month-card-title">
                <Calendar size={14} color="#ffa116" />
                <span>{mObj.monthName}</span>
              </div>
              <span className={`month-card-badge ${mObj.monthTotal > 0 ? "has-subs" : "no-subs"}`}>
                {mObj.monthTotal} {mObj.monthTotal === 1 ? "problem" : "problems"}
              </span>
            </div>

            {/* Weekday headers */}
            <div className="calendar-weekdays-row">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                <span key={dayName} className="calendar-weekday-label">
                  {dayName}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="calendar-days-grid">
              {mObj.days.map((d, dIdx) => {
                if (!d) {
                  return <div key={`empty-${dIdx}`} className="cal-day-cell empty" />;
                }
                const levelCls = getLevelClass(d.count);

                return (
                  <div
                    key={d.dateKey}
                    className={`cal-day-cell ${levelCls}`}
                    onMouseEnter={() => setHoveredCell(d)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status & Legend Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ fontSize: "13px", color: hoveredCell ? "#ffa116" : "var(--text-secondary)", minHeight: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
          {hoveredCell ? (
            <>
              <CheckCircle2 size={15} color="#ffa116" />
              <span>
                <strong>{formatDayOnly(hoveredCell.dateObj)}</strong>:{" "}
                <strong style={{ color: "#f3f4f6" }}>
                  {hoveredCell.count} problem{hoveredCell.count === 1 ? "" : "s"} completed
                </strong>
              </span>
            </>
          ) : (
            <span>Hover over any calendar date to view daily solved problems</span>
          )}
        </div>

        <div className="heatmap-legend" style={{ margin: 0 }}>
          <span>Less</span>
          <div className="heatmap-legend-box" style={{ background: "#1c1e26", borderRadius: "3px" }} />
          <div className="heatmap-legend-box" style={{ background: "#0e4429", borderRadius: "3px" }} />
          <div className="heatmap-legend-box" style={{ background: "#006d32", borderRadius: "3px" }} />
          <div className="heatmap-legend-box" style={{ background: "#26a641", borderRadius: "3px" }} />
          <div className="heatmap-legend-box" style={{ background: "#00b8a3", borderRadius: "3px" }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Language Split & Graphical Chart Component
// ----------------------------------------------------------------------
function LanguageBreakdownChart({ languageBreakdown = [] }) {
  if (!languageBreakdown || languageBreakdown.length === 0) {
    return (
      <div className="lang-chart-card">
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Language Distribution</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No language records recorded.</p>
      </div>
    );
  }

  // Format language names
  const langNameMap = {
    c: "C",
    cpp: "C++",
    java: "Java",
    python: "Python",
    python3: "Python 3",
    javascript: "JavaScript",
    typescript: "TypeScript",
    csharp: "C#",
    golang: "Go",
    rust: "Rust",
    ruby: "Ruby",
    swift: "Swift",
    kotlin: "Kotlin",
  };

  return (
    <div className="lang-chart-card">
      <div className="lang-chart-header">
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "600" }}>Language-wise Problem Split</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Graphical difficulty distribution (Easy, Medium, Hard) across programming languages.
          </p>
        </div>
      </div>

      <div className="lang-chart-grid">
        {languageBreakdown.map((l) => {
          const total = l.total || 1;
          const easyPct = (l.easy / total) * 100;
          const medPct = (l.medium / total) * 100;
          const hardPct = (l.hard / total) * 100;

          return (
            <div key={l.language} className="lang-row">
              <div className="lang-row-header">
                <div className="lang-name-tag">
                  <FileCode2 size={16} color="#ffa116" />
                  <span>{langNameMap[l.language] || l.language.toUpperCase()}</span>
                </div>
                <div className="lang-total-badge">
                  <strong>{l.total}</strong> unique solved ({l.totalSubmissions} submissions)
                </div>
              </div>

              {/* Graphical Stacked Progress Bar */}
              <div className="lang-stacked-bar">
                {l.easy > 0 && (
                  <div
                    className="bar-segment-easy"
                    style={{ width: `${easyPct}%` }}
                    title={`Easy: ${l.easy}`}
                  />
                )}
                {l.medium > 0 && (
                  <div
                    className="bar-segment-medium"
                    style={{ width: `${medPct}%` }}
                    title={`Medium: ${l.medium}`}
                  />
                )}
                {l.hard > 0 && (
                  <div
                    className="bar-segment-hard"
                    style={{ width: `${hardPct}%` }}
                    title={`Hard: ${l.hard}`}
                  />
                )}
              </div>

              {/* Detailed Breakdown Row */}
              <div className="lang-breakdown-details">
                <span className="diff-badge diff-badge-easy">
                  ● Easy: {l.easy}
                </span>
                <span className="diff-badge diff-badge-medium">
                  ● Medium: {l.medium}
                </span>
                <span className="diff-badge diff-badge-hard">
                  ● Hard: {l.hard}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Completed Programs List Component
// ----------------------------------------------------------------------
function CompletedProgramsList({ programs = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.language || "").toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchDiff =
        diffFilter === "all" ||
        p.difficulty.toLowerCase() === diffFilter.toLowerCase();
      return matchSearch && matchDiff;
    });
  }, [programs, searchTerm, diffFilter]);

  function getDifficultyBadgeClass(difficulty) {
    const d = (difficulty || "").toLowerCase();
    if (d === "easy") return "diff-badge-easy";
    if (d === "medium") return "diff-badge-medium";
    if (d === "hard") return "diff-badge-hard";
    return "";
  }

  return (
    <div className="table-card" style={{ marginTop: "24px" }}>
      <div className="table-card-header" style={{ borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#f3f4f6" }}>Completed Programs List</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Record of solved LeetCode problems with difficulty, language, and completion timestamp.
          </p>
        </div>

        {/* Toolbar inside completed list */}
        <div className="table-card-toolbar" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="search-box" style={{ width: "240px", height: "36px" }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search problem name or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: "13px" }}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="select-wrapper" style={{ height: "36px", padding: "0 10px" }}>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              style={{ fontSize: "13px" }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="empty-state">
          <Code2 size={40} className="empty-icon" />
          <h3>No completed programs recorded</h3>
          <p>
            {searchTerm || diffFilter !== "all"
              ? "No programs matched the search filter."
              : "No submissions recorded for this student yet."}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="students-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Problem Name</th>
                <th>Difficulty</th>
                <th>Language</th>
                <th style={{ textAlign: "right" }}>Date Completed</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((p, idx) => (
                <tr key={p.id || idx}>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <a
                        href={p.titleSlug ? `https://leetcode.com/problems/${p.titleSlug}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="leetcode-link"
                        style={{ color: "#f3f4f6", fontWeight: "500" }}
                      >
                        <span>{p.title}</span>
                        {p.titleSlug && <ExternalLink size={12} />}
                      </a>
                    </div>
                  </td>
                  <td>
                    <span className={`diff-badge ${getDifficultyBadgeClass(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td>
                    <span className="batch-pill" style={{ textTransform: "uppercase", fontSize: "11px" }}>
                      {p.language}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-secondary)", fontSize: "13px" }}>
                    {formatDate(p.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-footer-summary">
        <span>
          Showing <strong>{filteredPrograms.length}</strong> of <strong>{programs.length}</strong> total records
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Dashboard (Home) Component
// ----------------------------------------------------------------------
export default function Home() {
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student Detail View selection
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");

  // Fetch dashboard overview
  async function fetchOverview() {
    try {
      const q = selectedBatch !== "all" ? `?batch=${selectedBatch}` : "";
      const res = await fetch(`/api/dashboard/overview${q}`);
      if (!res.ok) throw new Error("Failed to load overview data.");
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // Fetch students list with submission stats
  async function fetchStudents() {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (selectedBatch !== "all") qParams.append("batch", selectedBatch);

      const res = await fetch(`/api/dashboard/students?${qParams.toString()}`);
      if (!res.ok) throw new Error("Failed to load students data.");
      const data = await res.json();
      const rankedData = data.map((item, idx) => ({
        ...item,
        rank: item.rank || idx + 1,
      }));
      setStudents(rankedData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch single student submission details
  async function fetchStudentDetails(id) {
    setStudentLoading(true);
    setStudentError("");
    try {
      const res = await fetch(`/api/dashboard/students/${id}`);
      if (!res.ok) throw new Error("Failed to load student details.");
      const data = await res.json();
      setStudentDetails(data);
    } catch (err) {
      setStudentError(err.message);
    } finally {
      setStudentLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
    fetchStudents();
  }, [selectedBatch]);

  // When clicking student name
  function handleSelectStudent(studentId) {
    setSelectedStudentId(studentId);
    fetchStudentDetails(studentId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBackToDashboard() {
    setSelectedStudentId(null);
    setStudentDetails(null);
    setStudentError("");
  }

  // Filter students by search locally for instant response
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const term = search.toLowerCase().trim();
    return students.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const reg = (s.regNo || "").toLowerCase();
      const lc = (s.leetcodeUsername || "").toLowerCase();
      return name.includes(term) || reg.includes(term) || lc.includes(term);
    });
  }, [students, search]);

  // Max solved count for relative bar width
  const maxSolved = useMemo(() => {
    if (students.length === 0) return 1;
    return Math.max(...students.map((s) => s.stats.totalSolved), 1);
  }, [students]);

  // ----------------------------------------------------------------------
  // If a student is selected -> Show Student Detail View
  // ----------------------------------------------------------------------
  if (selectedStudentId) {
    const student = studentDetails?.student;
    const stats = studentDetails?.stats;
    const currentStudentRank = students.find((s) => s._id === selectedStudentId)?.rank;

    return (
      <div className="students-container">
        {/* Back navigation header */}
        <div className="student-detail-header">
          <button className="back-button" onClick={handleBackToDashboard}>
            <ChevronLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {student && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="batch-pill">Batch {student.batch}</span>
              {student.leetcodeUsername && (
                <a
                  href={`https://leetcode.com/u/${student.leetcodeUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="leetcode-link"
                >
                  <img
                    src="https://cdn.simpleicons.org/leetcode/FFA116"
                    alt="LeetCode"
                    className="lc-small-icon"
                  />
                  <span>{student.leetcodeUsername}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        {studentLoading ? (
          <div className="table-loading">
            <div className="loader"></div>
            <p>Loading student submission details & analytics...</p>
          </div>
        ) : studentError ? (
          <div className="alert-banner error-banner">
            <span>{studentError}</span>
          </div>
        ) : (
          studentDetails && (
            <>
              {/* Student Header Card */}
              <div className="student-detail-info-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div className="admin-avatar" style={{ width: "54px", height: "54px", fontSize: "22px", background: "#252834", flexShrink: 0 }}>
                    {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f3f4f6", wordBreak: "break-word" }}>{student.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>
                      {student.regNo && <span>Reg: <strong style={{ color: "#f3f4f6" }}>{student.regNo}</strong></span>}
                      {student.regNo && <span>•</span>}
                      <span style={{ wordBreak: "break-all" }}>Email: {student.email}</span>
                    </div>
                  </div>
                </div>

                <div className="student-rank-badge" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Batch Rank</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#ffa116" }}>
                      {currentStudentRank ? `#${currentStudentRank}` : (stats?.totalSolved > 0 ? "Ranked" : "Unranked")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Easy, Medium, Hard Cards */}
              <div className="stats-cards-grid">
                <div className="stat-card">
                  <div className="stat-card-info">
                    <h4>Total Solved</h4>
                    <div className="stat-card-value" style={{ color: "#ffa116" }}>
                      {stats.totalSolved}
                    </div>
                    <div className="stat-card-sub">
                      from {stats.totalSubmissions} total submission{stats.totalSubmissions === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="stat-card-icon" style={{ background: "rgba(255, 161, 22, 0.12)", color: "#ffa116" }}>
                    <Award size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <h4>Easy Problems</h4>
                    <div className="stat-card-value lc-easy-color">
                      {stats.easy}
                    </div>
                    <div className="stat-card-sub">
                      {stats.totalSolved > 0 ? `${Math.round((stats.easy / stats.totalSolved) * 100)}% of solved` : "0%"}
                    </div>
                  </div>
                  <div className="stat-card-icon lc-easy-bg">
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <h4>Medium Problems</h4>
                    <div className="stat-card-value lc-medium-color">
                      {stats.medium}
                    </div>
                    <div className="stat-card-sub">
                      {stats.totalSolved > 0 ? `${Math.round((stats.medium / stats.totalSolved) * 100)}% of solved` : "0%"}
                    </div>
                  </div>
                  <div className="stat-card-icon lc-medium-bg">
                    <Layers size={24} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <h4>Hard Problems</h4>
                    <div className="stat-card-value lc-hard-color">
                      {stats.hard}
                    </div>
                    <div className="stat-card-sub">
                      {stats.totalSolved > 0 ? `${Math.round((stats.hard / stats.totalSolved) * 100)}% of solved` : "0%"}
                    </div>
                  </div>
                  <div className="stat-card-icon lc-hard-bg">
                    <Flame size={24} />
                  </div>
                </div>
              </div>

              {/* Submission Heatmap */}
              <SubmissionHeatmap heatmapData={studentDetails.heatmap} />

              {/* Language-wise Split & Graphical View */}
              <LanguageBreakdownChart languageBreakdown={studentDetails.languageBreakdown} />

              {/* Completed Programs List */}
              <CompletedProgramsList programs={studentDetails.programsCompleted} />
            </>
          )
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // Normal Home View: Overview & Students List with Difficulty Bars
  // ----------------------------------------------------------------------
  const batches = overview?.availableBatches || [];
  const currentBatchSummary =
    overview?.batchesSummary?.find((b) => b.batch === parseInt(selectedBatch, 10)) ||
    (selectedBatch === "all" ? { totalProblemsSolved: overview?.totalProblemsSolved || 0 } : null);

  return (
    <div className="students-container">
      {/* Header */}
      <div className="students-header">
        <div>
          <h2>Student Performance Dashboard</h2>
          <p>Real-time LeetCode submissions tracking, batch statistics, and problem completion progress.</p>
        </div>

        {/* Batch Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="select-wrapper">
            <Calendar size={15} />
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-banner error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* Top Overview Stat Cards */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-card-info">
            <h4>Total Students</h4>
            <div className="stat-card-value">
              {overview ? overview.totalStudents : "-"}
            </div>
            <div className="stat-card-sub">
              {selectedBatch === "all"
                ? "Enrolled across all batches"
                : `Enrolled in Batch ${selectedBatch}`}
            </div>
          </div>
          <div className="stat-card-icon" style={{ background: "rgba(255, 161, 22, 0.12)", color: "#ffa116" }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h4>Total Problems Solved</h4>
            <div className="stat-card-value" style={{ color: "#00b8a3" }}>
              {currentBatchSummary ? currentBatchSummary.totalProblemsSolved : overview?.totalProblemsSolved || 0}
            </div>
            <div className="stat-card-sub">
              {selectedBatch === "all"
                ? "Total solved across all students"
                : `Total solved by Batch ${selectedBatch}`}
            </div>
          </div>
          <div className="stat-card-icon" style={{ background: "rgba(0, 184, 163, 0.12)", color: "#00b8a3" }}>
            <Code2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h4>Difficulty Distribution</h4>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", marginBottom: "4px" }}>
              <span className="diff-badge diff-badge-easy" style={{ fontSize: "13px", padding: "3px 8px" }}>
                Easy: {overview?.difficultySummary?.easy || 0}
              </span>
              <span className="diff-badge diff-badge-medium" style={{ fontSize: "13px", padding: "3px 8px" }}>
                Med: {overview?.difficultySummary?.medium || 0}
              </span>
              <span className="diff-badge diff-badge-hard" style={{ fontSize: "13px", padding: "3px 8px" }}>
                Hard: {overview?.difficultySummary?.hard || 0}
              </span>
            </div>
            <div className="stat-card-sub">Cumulative difficulty solved</div>
          </div>
          <div className="stat-card-icon" style={{ background: "rgba(255, 192, 30, 0.12)", color: "#ffc01e" }}>
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="students-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search student by name, regNo, or LeetCode username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <span>Click any student's name to view their heatmap & full analytics</span>
        </div>
      </div>

      {/* Students List Table with Progress Bars */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">
            <div className="loader"></div>
            <p>Loading student records and submission progress...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No students found</h3>
            <p>
              {search || selectedBatch !== "all"
                ? "No student records matched your search filters."
                : "No student records found in the system."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Rank</th>
                  <th>Student Name</th>
                  <th>Batch</th>
                  <th>LeetCode Profile</th>
                  <th style={{ minWidth: "260px" }}>Solved Breakdown (Easy / Medium / Hard)</th>
                  <th style={{ textAlign: "center" }}>Total Solved</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, index) => {
                  const easy = s.stats.easy || 0;
                  const medium = s.stats.medium || 0;
                  const hard = s.stats.hard || 0;
                  const total = s.stats.totalSolved || 0;

                  // Bar segment widths relative to this student's solved or relative to max
                  const barTotal = total > 0 ? total : 1;
                  const easyPct = (easy / barTotal) * 100;
                  const medPct = (medium / barTotal) * 100;
                  const hardPct = (hard / barTotal) * 100;

                  return (
                    <tr key={s._id}>
                      <td>
                        <span style={{ color: s.rank <= 3 && total > 0 ? "#ffa116" : "var(--text-secondary)", fontWeight: "700" }}>
                          #{s.rank}
                        </span>
                      </td>

                      <td>
                        <div className="student-name-cell">
                          <div className="admin-avatar" style={{ width: 32, height: 32, fontSize: 13, background: total > 0 ? "#222d26" : "#22242c" }}>
                            {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <span
                              className="clickable-student-name"
                              onClick={() => handleSelectStudent(s._id)}
                              title="Click to view full submission analytics, heatmap and completed programs"
                            >
                              {s.name}
                            </span>
                            {s.regNo && (
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                {s.regNo}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="batch-pill">Batch {s.batch}</span>
                      </td>

                      <td>
                        {s.leetcodeUsername ? (
                          <a
                            href={`https://leetcode.com/u/${s.leetcodeUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="leetcode-link"
                          >
                            <img
                              src="https://cdn.simpleicons.org/leetcode/FFA116"
                              alt="LC"
                              className="lc-small-icon"
                            />
                            <span>{s.leetcodeUsername}</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="unregistered-badge">Unregistered</span>
                        )}
                      </td>

                      {/* Easy / Medium / Hard Progress Bar */}
                      <td>
                        <div className="difficulty-bar-container">
                          {total > 0 ? (
                            <>
                              <div className="stacked-difficulty-bar">
                                {easy > 0 && (
                                  <div
                                    className="bar-segment-easy"
                                    style={{ width: `${easyPct}%` }}
                                    title={`Easy: ${easy}`}
                                  />
                                )}
                                {medium > 0 && (
                                  <div
                                    className="bar-segment-medium"
                                    style={{ width: `${medPct}%` }}
                                    title={`Medium: ${medium}`}
                                  />
                                )}
                                {hard > 0 && (
                                  <div
                                    className="bar-segment-hard"
                                    style={{ width: `${hardPct}%` }}
                                    title={`Hard: ${hard}`}
                                  />
                                )}
                              </div>

                              <div className="difficulty-badges-row">
                                <span className="diff-badge diff-badge-easy">
                                  ● {easy} Easy
                                </span>
                                <span className="diff-badge diff-badge-medium">
                                  ● {medium} Med
                                </span>
                                <span className="diff-badge diff-badge-hard">
                                  ● {hard} Hard
                                </span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div
                                className="stacked-difficulty-bar"
                                style={{ width: "100%", background: "#20222a" }}
                              />
                              <span style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                0 solved
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Solved Badge */}
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="status-pill"
                          style={{
                            background: total > 0 ? "rgba(0, 184, 163, 0.15)" : "#22242c",
                            color: total > 0 ? "#00b8a3" : "var(--text-secondary)",
                            fontWeight: "700",
                          }}
                        >
                          {total}
                        </span>
                      </td>

                      {/* View Action */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="action-icon-btn view-btn"
                          title="View Student Heatmap & Submissions"
                          onClick={() => handleSelectStudent(s._id)}
                        >
                          <ChevronLeft size={16} style={{ transform: "rotate(180deg)" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer-summary">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
          </span>
        </div>
      </div>
    </div>
  );
}
