import { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  ShieldCheck,
  User,
  AtSign,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Settings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Auto-dismiss alert
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  function getAuthHeaders() {
    const token = localStorage.getItem("admin_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // Fetch all admins
  async function fetchAdmins() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load admin accounts.");
      }

      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    if (!search.trim()) return admins;
    const term = search.toLowerCase().trim();
    return admins.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(term) ||
        (a.username || "").toLowerCase().includes(term)
    );
  }, [admins, search]);

  // Modal open triggers
  function openAddModal() {
    setAddForm({ name: "", username: "", password: "", confirmPassword: "" });
    setFormError("");
    setShowPassword(false);
    setIsAddModalOpen(true);
  }

  function openEditModal(admin) {
    setSelectedAdmin(admin);
    setEditForm({ name: admin.name || "", username: admin.username || "" });
    setFormError("");
    setIsEditModalOpen(true);
  }

  function openPasswordModal(admin) {
    setSelectedAdmin(admin);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setFormError("");
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  }

  function openDeleteModal(admin) {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  }

  // Handle Add Admin
  async function handleAddAdmin(e) {
    e.preventDefault();
    setFormError("");

    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.password) {
      setFormError("All fields are required.");
      return;
    }

    if (addForm.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (addForm.password !== addForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name: addForm.name.trim(),
          username: addForm.username.trim().toLowerCase(),
          password: addForm.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errorMessage || "Failed to create admin.");
      }

      setSuccessMessage(`Admin user "${addForm.name}" created successfully!`);
      setIsAddModalOpen(false);
      fetchAdmins();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Handle Edit Admin
  async function handleEditAdmin(e) {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError("");

    if (!editForm.name.trim() || !editForm.username.trim()) {
      setFormError("Name and username are required.");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          username: editForm.username.trim().toLowerCase(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errorMessage || "Failed to update admin.");
      }

      setSuccessMessage(`Admin user "${editForm.name}" updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Handle Change Password
  async function handleChangePassword(e) {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError("");

    if (!passwordForm.newPassword) {
      setFormError("New password is required.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setFormError("New password must be at least 6 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/${selectedAdmin._id}/password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errorMessage || "Failed to change password.");
      }

      setSuccessMessage(`Password updated successfully for ${selectedAdmin.name}!`);
      setIsPasswordModalOpen(false);
      setSelectedAdmin(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // Handle Delete Admin
  async function handleDeleteAdmin() {
    if (!selectedAdmin) return;
    setFormLoading(true);
    try {
      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errorMessage || "Failed to delete admin.");
      }

      setSuccessMessage(`Admin "${selectedAdmin.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
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
          <h2>Admin Settings</h2>
          <p>Manage system administrators, security credentials, and account permissions.</p>
        </div>
        <button className="primary-action-btn" onClick={openAddModal}>
          <UserPlus size={18} />
          <span>Create Admin</span>
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

      {/* Toolbar / Search */}
      <div className="students-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search admins by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Admins Table */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">
            <div className="loader"></div>
            <p>Loading administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={48} className="empty-icon" />
            <h3>No administrators found</h3>
            <p>
              {search
                ? "No admin accounts match your search filter."
                : "No admin accounts found."}
            </p>
            <button className="primary-action-btn" onClick={openAddModal}>
              <UserPlus size={16} />
              <span>Create Admin</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Admin Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td>
                      <div className="student-name-cell">
                        <div className="admin-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                          {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <span className="student-name">{admin.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="reg-badge">@{admin.username}</span>
                    </td>
                    <td>
                      <span className="status-pill status-active">
                        Administrator
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="action-icon-btn edit-btn"
                          title="Change Password"
                          onClick={() => openPasswordModal(admin)}
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          className="action-icon-btn view-btn"
                          title="Edit Admin"
                          onClick={() => openEditModal(admin)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn delete-btn"
                          title="Delete Admin"
                          onClick={() => openDeleteModal(admin)}
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
            Total: <strong>{filteredAdmins.length}</strong> admin account(s)
          </span>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Admin</h3>
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

            <form onSubmit={handleAddAdmin}>
              <div className="modal-form-grid">
                <div className="form-group full-width">
                  <label>Full Name</label>
                  <div className="modal-input-field">
                    <User size={16} />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm({ ...addForm, name: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Username</label>
                  <div className="modal-input-field">
                    <AtSign size={16} />
                    <input
                      type="text"
                      placeholder="e.g. johndoe"
                      value={addForm.username}
                      onChange={(e) =>
                        setAddForm({ ...addForm, username: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="modal-input-field">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm({ ...addForm, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: "transparent", border: "none", color: "#9295a1", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="modal-input-field">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={addForm.confirmPassword}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
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
                  {formLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {isEditModalOpen && selectedAdmin && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Admin Account</h3>
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

            <form onSubmit={handleEditAdmin}>
              <div className="modal-form-grid">
                <div className="form-group full-width">
                  <label>Full Name</label>
                  <div className="modal-input-field">
                    <User size={16} />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Username</label>
                  <div className="modal-input-field">
                    <AtSign size={16} />
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      required
                    />
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

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && selectedAdmin && (
        <div className="modal-backdrop" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password: {selectedAdmin.name}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsPasswordModalOpen(false)}
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

            <form onSubmit={handleChangePassword}>
              <div className="modal-form-grid">
                <div className="form-group full-width">
                  <label>New Password</label>
                  <div className="modal-input-field">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: "transparent", border: "none", color: "#9295a1", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Confirm New Password</label>
                  <div className="modal-input-field">
                    <Lock size={16} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-type new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={formLoading}
                >
                  {formLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card delete-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h3>Delete Administrator</h3>
            <p>
              Are you sure you want to permanently delete admin account{" "}
              <strong>"{selectedAdmin.name}"</strong> (@{selectedAdmin.username})? This action cannot be undone.
            </p>

            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={handleDeleteAdmin}
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Yes, Delete Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
