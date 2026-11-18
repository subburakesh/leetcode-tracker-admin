import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  X,
  Archive,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Mail,
  Hash,
  User,
  Code2,
} from "lucide-react";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form state
  const initialFormData = {
    regNo: "",
    name: "",
    email: "",
    batch: new Date().getFullYear(),
    leetcodeUsername: "",
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem("admin_token");
    const headers = { ...extra };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async function fetchStudents() {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (batchFilter !== "all") queryParams.append("batch", batchFilter);
      if (search.trim()) queryParams.append("search", search.trim());

      const url = `/api/students${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load students.");
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [statusFilter, batchFilter]);

  // Handle instant client-side filtering while typing search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const term = search.toLowerCase().trim();
    return students.filter((s) => {
      const reg = (s.regNo || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const lc = (s.leetcodeUsername || "").toLowerCase();
      return (
        reg.includes(term) ||
        name.includes(term) ||
        email.includes(term) ||
        lc.includes(term)
      );
    });
  }, [students, search]);

  // Available batches list from data
  const availableBatches = useMemo(() => {
    const batches = new Set(students.map((s) => s.batch).filter(Boolean));
    const currentYear = new Date().getFullYear();
    batches.add(currentYear);
    batches.add(currentYear + 1);
    batches.add(currentYear - 1);
    return Array.from(batches).sort((a, b) => b - a);
  }, [students]);

  // Modal open helpers
  function openAddModal() {
    setFormData(initialFormData);
    setFormError("");
    setIsAddModalOpen(true);
  }

  function openEditModal(student) {
    setSelectedStudent(student);
    setFormData({
      regNo: student.regNo || "",
      name: student.name || "",
      email: student.email || "",
      batch: student.batch || new Date().getFullYear(),
      leetcodeUsername: student.leetcodeUsername || "",
      status: student.status || "active",
    });
    setFormError("");
    setIsEditModalOpen(true);
  }

  function openViewModal(student) {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  }

  function openDeleteModal(student) {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  }

  // Submit Create Student
  async function handleCreateStudent(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        regNo: formData.regNo.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        batch: parseInt(formData.batch, 10),
        status: formData.status,
      };

      if (formData.leetcodeUsername.trim()) {
        payload.leetcodeUsername = formData.leetcodeUsername.trim();
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create student.");
      }

      setSuccessMessage(`Student ${payload.name} created successfully!`);
      setIsAddModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Submit Update Student
  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        regNo: formData.regNo.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        batch: parseInt(formData.batch, 10),
        status: formData.status,
        leetcodeUsername: formData.leetcodeUsername.trim(),
      };

      const response = await fetch(`/api/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update student.");
      }

      setSuccessMessage(`Student ${payload.name} updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Quick Toggle Archive / Activate
  async function handleToggleStatus(student) {
    const newStatus = student.status === "archived" ? "active" : "archived";
    try {
      const payload = {
        regNo: student.regNo,
        name: student.name,
        email: student.email,
        batch: student.batch,
        leetcodeUsername: student.leetcodeUsername || "",
        status: newStatus,
      };

      const response = await fetch(`/api/students/${student._id}`, {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update student status.");
      }

      setSuccessMessage(
        `Student ${student.name} marked as ${newStatus}.`
      );
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  }

  // Confirm Delete Student
  async function handleDeleteStudent() {
    if (!selectedStudent) return;
    setFormLoading(true);

    try {
      const response = await fetch(`/api/students/${selectedStudent._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete student.");
      }

      setSuccessMessage(`Student ${selectedStudent.name} deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      setError(err.message);
      setIsDeleteModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="students-container">
      {/* Page Header */}
      <div className="students-header">
        <div>
          <h2>Students Directory</h2>
          <p>Create, manage, and monitor student LeetCode accounts and status.</p>
        </div>
        <button className="primary-action-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Student</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert-banner success-banner">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="alert-banner error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Toolbar / Search & Filters */}
      <div className="students-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, regNo, email, or LeetCode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          {/* Batch Selector */}
          <div className="select-wrapper">
            <Calendar size={15} />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
            >
              <option value="all">All Batches</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="status-toggle-group">
            <button
              className={`status-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={`status-btn ${statusFilter === "active" ? "active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={`status-btn ${statusFilter === "archived" ? "active" : ""}`}
              onClick={() => setStatusFilter("archived")}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Data View */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">
            <div className="loader"></div>
            <p>Loading students records...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No students found</h3>
            <p>
              {search || batchFilter !== "all" || statusFilter !== "all"
                ? "No student records matched your search filters."
                : "Your student roster is currently empty. Get started by adding a student."}
            </p>
            <button className="primary-action-btn" onClick={openAddModal}>
              <Plus size={16} />
              <span>Add Student</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Batch</th>
                  <th>LeetCode Profile</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span className="reg-badge">{s.regNo}</span>
                    </td>
                    <td>
                      <div className="student-name-cell">
                        <span className="student-name">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="student-email">{s.email}</span>
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
                          title="Open LeetCode Profile"
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
                    <td>
                      <span
                        className={`status-pill ${
                          s.status === "archived" ? "status-archived" : "status-active"
                        }`}
                      >
                        {s.status === "archived" ? "Archived" : "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="action-icon-btn view-btn"
                          title="View Details"
                          onClick={() => openViewModal(s)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-icon-btn edit-btn"
                          title="Edit Student"
                          onClick={() => openEditModal(s)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn archive-btn"
                          title={
                            s.status === "archived"
                              ? "Activate Student"
                              : "Archive Student"
                          }
                          onClick={() => handleToggleStatus(s)}
                        >
                          {s.status === "archived" ? (
                            <RotateCcw size={16} />
                          ) : (
                            <Archive size={16} />
                          )}
                        </button>
                        <button
                          className="action-icon-btn delete-btn"
                          title="Delete Student"
                          onClick={() => openDeleteModal(s)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer-summary">
          <span>
            Showing <strong>{filteredStudents.length}</strong> of{" "}
            <strong>{students.length}</strong> total students
          </span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Student</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Registration Number (Unique)</label>
                  <div className="modal-input-field">
                    <Hash size={16} />
                    <input
                      type="text"
                      placeholder="e.g. 22MCA010"
                      value={formData.regNo}
                      onChange={(e) =>
                        setFormData({ ...formData, regNo: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <div className="modal-input-field">
                    <User size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Subrahmanyam"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="modal-input-field">
                    <Mail size={16} />
                    <input
                      type="email"
                      placeholder="e.g. student@college.edu"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Batch (Graduation Year)</label>
                  <div className="modal-input-field">
                    <Calendar size={16} />
                    <input
                      type="number"
                      placeholder="e.g. 2026"
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>LeetCode Username (Optional)</label>
                  <div className="modal-input-field">
                    <Code2 size={16} />
                    <input
                      type="text"
                      placeholder="e.g. subbu_codes (leave blank if unregistered)"
                      value={formData.leetcodeUsername}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          leetcodeUsername: e.target.value,
                        })
                      }
                    />
                  </div>
                  <span className="field-hint">
                    Unique and case-insensitive. Omitted if unregistered.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label>Account Status</label>
                  <div className="radio-pill-group">
                    <label
                      className={`radio-pill ${
                        formData.status === "active" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={() =>
                          setFormData({ ...formData, status: "active" })
                        }
                      />
                      Active (Monitored)
                    </label>
                    <label
                      className={`radio-pill ${
                        formData.status === "archived" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value="archived"
                        checked={formData.status === "archived"}
                        onChange={() =>
                          setFormData({ ...formData, status: "archived" })
                        }
                      />
                      Archived (Inactive)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={formLoading}
                >
                  {formLoading ? "Adding Student..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Student</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudent}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Registration Number (Unique)</label>
                  <div className="modal-input-field">
                    <Hash size={16} />
                    <input
                      type="text"
                      value={formData.regNo}
                      onChange={(e) =>
                        setFormData({ ...formData, regNo: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <div className="modal-input-field">
                    <User size={16} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="modal-input-field">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Batch Year</label>
                  <div className="modal-input-field">
                    <Calendar size={16} />
                    <input
                      type="number"
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>LeetCode Username (Optional)</label>
                  <div className="modal-input-field">
                    <Code2 size={16} />
                    <input
                      type="text"
                      placeholder="Leave blank to remove / unregistered"
                      value={formData.leetcodeUsername}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          leetcodeUsername: e.target.value,
                        })
                      }
                    />
                  </div>
                  <span className="field-hint">
                    Leave blank if the student does not have a LeetCode username.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label>Account Status</label>
                  <div className="radio-pill-group">
                    <label
                      className={`radio-pill ${
                        formData.status === "active" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit-status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={() =>
                          setFormData({ ...formData, status: "active" })
                        }
                      />
                      Active (Monitored)
                    </label>
                    <label
                      className={`radio-pill ${
                        formData.status === "archived" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit-status"
                        value="archived"
                        checked={formData.status === "archived"}
                        onChange={() =>
                          setFormData({ ...formData, status: "archived" })
                        }
                      />
                      Archived (Inactive)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={formLoading}
                >
                  {formLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-card view-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="view-detail-body">
              <div className="view-user-badge">
                <div className="view-avatar">
                  <User size={24} />
                </div>
                <div>
                  <h4>{selectedStudent.name}</h4>
                  <span className="reg-badge">{selectedStudent.regNo}</span>
                </div>
                <span
                  className={`status-pill ${
                    selectedStudent.status === "archived"
                      ? "status-archived"
                      : "status-active"
                  }`}
                  style={{ marginLeft: "auto" }}
                >
                  {selectedStudent.status === "archived" ? "Archived" : "Active"}
                </span>
              </div>

              <div className="view-grid">
                <div className="view-item">
                  <span className="view-label">Email</span>
                  <span className="view-value">{selectedStudent.email}</span>
                </div>

                <div className="view-item">
                  <span className="view-label">Batch</span>
                  <span className="view-value">{selectedStudent.batch}</span>
                </div>

                <div className="view-item">
                  <span className="view-label">LeetCode Username</span>
                  <span className="view-value">
                    {selectedStudent.leetcodeUsername ? (
                      <a
                        href={`https://leetcode.com/u/${selectedStudent.leetcodeUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="leetcode-link"
                      >
                        <img
                          src="https://cdn.simpleicons.org/leetcode/FFA116"
                          alt="LC"
                          className="lc-small-icon"
                        />
                        <span>{selectedStudent.leetcodeUsername}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="unregistered-badge">Unregistered</span>
                    )}
                  </span>
                </div>

                <div className="view-item">
                  <span className="view-label">Database ID (studentId)</span>
                  <code className="view-code">{selectedStudent._id}</code>
                </div>

                <div className="view-item">
                  <span className="view-label">Created At</span>
                  <span className="view-value">
                    {selectedStudent.createdAt
                      ? new Date(selectedStudent.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                <div className="view-item">
                  <span className="view-label">Updated At</span>
                  <span className="view-value">
                    {selectedStudent.updatedAt
                      ? new Date(selectedStudent.updatedAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                {selectedStudent.archivedAt && (
                  <div className="view-item full-width">
                    <span className="view-label">Archived At</span>
                    <span className="view-value">
                      {new Date(selectedStudent.archivedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedStudent);
                  }}
                >
                  <Edit2 size={15} />
                  <span>Edit Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedStudent && (
        <div
          className="modal-backdrop"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="modal-card delete-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <Trash2 size={28} />
            </div>
            <h3>Delete Student Record?</h3>
            <p>
              Are you sure you want to permanently delete{" "}
              <strong>{selectedStudent.name}</strong> ({selectedStudent.regNo})?
              This record will be removed from MongoDB.
            </p>

            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                disabled={formLoading}
                onClick={handleDeleteStudent}
              >
                {formLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}