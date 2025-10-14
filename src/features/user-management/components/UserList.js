import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../../api';
import UserForm from '../UserForm';
import UserStatusForm from '../UserStatusForm';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 3000);
  };
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Load users
  const loadUsers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getUsers(page, pageSize);

      // Normalize various backend shapes into a plain array and pagination meta
      let list = [];
      let totalPagesFromApi = 1;
      let totalCountFromApi = 0;

      // 1) Already an array (our request() often unwraps { data } to array)
      if (Array.isArray(response)) {
        // To ensure correct totals, fetch full list for counting if server doesn't paginate
        try {
          const full = await userApi.getAllUsersUnpaged();
          const fullList = Array.isArray(full) ? full : (Array.isArray(full?.data) ? full.data : response);
          totalCountFromApi = fullList.length;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          list = fullList.slice(start, end);
        } catch {
          const fullList = response;
          totalCountFromApi = fullList.length;
          totalPagesFromApi = Math.max(1, Math.ceil(totalCountFromApi / pageSize));
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          list = fullList.slice(start, end);
        }
      }
      // 2) { data: [...] } or { Data: [...] }
      else if (response && (Array.isArray(response.data) || Array.isArray(response.Data))) {
        list = response.data || response.Data || [];
        totalPagesFromApi = response.totalPages || response.TotalPages || 1;
        totalCountFromApi = response.totalCount || response.TotalCount || list.length;
      }
      // 3) { items: [...] } or { Items: [...] } or nested under data
      else if (
        response && (
          Array.isArray(response.items) ||
          Array.isArray(response.Items) ||
          Array.isArray(response?.data?.items) ||
          Array.isArray(response?.Data?.Items)
        )
      ) {
        list = response.items || response.Items || response?.data?.items || response?.Data?.Items || [];
        totalPagesFromApi = response.totalPages || response?.data?.totalPages || 1;
        totalCountFromApi = response.totalCount || response?.data?.totalCount || list.length;
      }

      // Normalize role shapes per user
      const normalizeRoles = (u) => {
        if (!u) return u;
        const rawRoles = Array.isArray(u.roles) ? u.roles
          : (Array.isArray(u.roleNames) ? u.roleNames
          : (Array.isArray(u.Roles) ? u.Roles.map(r => r?.name || r?.roleName || r) : []));
        return { ...u, roles: rawRoles };
      };
      setUsers(list.map(normalizeRoles));
      setTotalPages(totalPagesFromApi || 1);
      setTotalUsers(totalCountFromApi || list.length || 0);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadUsers(newPage);
    }
  };

  // Handle create user
  const handleCreateUser = async (userData) => {
    try {
      setActionLoading(true);
      await userApi.createUser(userData);
      setShowCreateModal(false);
      await loadUsers(currentPage);
      showToast('User created successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (userData) => {
    try {
      setActionLoading(true);
      await userApi.updateUser(selectedUser.id, userData);
      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers(currentPage);
      showToast('User updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete user (after confirmation)
  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      await userApi.deleteUser(userId);
      await loadUsers(currentPage);
      showToast('User deleted successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status update (explicit value)
  const handleStatusUpdate = async (status) => {
    try {
      setActionLoading(true);
      await userApi.updateUserStatus(selectedUser.id, status);
      setShowStatusModal(false);
      setSelectedUser(null);
      await loadUsers(currentPage);
      showToast('Status updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle status Active <-> Inactive directly via lock icon
  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(true);
      const next = (user.status || '').toLowerCase() === 'active' ? 'Inactive' : 'Active';
      await userApi.updateUserStatus(user.id, next);
      await loadUsers(currentPage);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Open status modal
  // (Removed unused openStatusModal)

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-badge active';
      case 'inactive':
        return 'status-badge inactive';
      case 'locked':
        return 'status-badge locked';
      default:
        return 'status-badge unknown';
    }
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
      <div className="user-list-header">
        <h2>User Management</h2>
        <button 
          className="btn-new-booking"
          onClick={() => setShowCreateModal(true)}
          disabled={actionLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create New User
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => loadUsers()} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      <div className="user-list-stats">
        <span>Total users: {totalUsers}</span>
        <span>Page {currentPage} / {totalPages}</span>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th className="col-email">Email</th>
              <th className="col-username">Username</th>
              <th className="col-fullname">Full name</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No user data
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id?.substring(0, 8)}...</td>
                  <td className="col-email">{user.email}</td>
                  <td className="col-username">{user.username}</td>
                  <td className="col-fullname">{user.fullname}</td>
                  <td>
                    <div className="roles-container">
                      {user.roles?.map((role, index) => (
                        <span key={index} className="role-badge neutral">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(user.status)}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-yellow"
                        onClick={async () => {
                          setShowViewModal(true);
                          setViewLoading(true);
                          try {
                            const detail = await userApi.getUserById(user.id);
                            const data = (detail && (detail.data || detail.Data)) || detail;
                            const normalized = data ? { ...data, roles: (Array.isArray(data.roles) ? data.roles : (Array.isArray(data.roleNames) ? data.roleNames : (Array.isArray(data.Roles) ? data.Roles.map(r => r?.name || r?.roleName || r) : []))) } : user;
                            setSelectedUser(normalized);
                          } catch {
                            setSelectedUser(user);
                          } finally {
                            setViewLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        aria-label="View details"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-blue"
                        onClick={() => openEditModal(user)}
                        disabled={actionLoading}
                        aria-label="Edit user"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-purple"
                        onClick={() => handleToggleStatus(user)}
                        disabled={actionLoading}
                        aria-label="Toggle status"
                        title={(user.status || '').toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {(user.status || '').toLowerCase() === 'active' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v1"></path></svg>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-red"
                        onClick={() => setConfirmDeleteUser(user)}
                        disabled={actionLoading}
                        aria-label="Delete user"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || actionLoading}
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || actionLoading}
        >
          Next
        </button>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <UserForm
          title="Create new user"
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      )}

      {showEditModal && selectedUser && (
        <UserForm
          title="Edit user"
          user={selectedUser}
          onSubmit={handleEditUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          loading={actionLoading}
          isEdit={true}
        />
      )}

      {showStatusModal && selectedUser && (
        <UserStatusForm
          user={selectedUser}
          onSubmit={handleStatusUpdate}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedUser(null);
          }}
          loading={actionLoading}
        />
      )}

      {/* View details modal */}
      {showViewModal && (
        <div className="modal-overlay">
          <div className="modal-content form-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>User details</h3>
              <button
                className="modal-close-btn"
                onClick={() => { setShowViewModal(false); setSelectedUser(null); }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="user-info" style={{ padding: '1rem 1.5rem' }}>
              {viewLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                selectedUser && (
                  <div className="user-details">
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Username:</strong> {selectedUser.username}</p>
                    <p><strong>Full name:</strong> {selectedUser.fullname}</p>
                    <p><strong>Student ID:</strong> {selectedUser.mssv || selectedUser.MSSV}</p>
                    <p><strong>Roles:</strong> {(selectedUser.roles || []).join(', ')}</p>
                    <p><strong>Status:</strong> {selectedUser.status || 'Unknown'}</p>
                  </div>
                )
              )}
            </div>
            {/* No footer actions; use X to close */}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteUser && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>Delete account</h3>
              <button
                className="modal-close-btn"
                onClick={() => setConfirmDeleteUser(null)}
                disabled={actionLoading}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="confirm-body">
              <div className="confirm-icon danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
              </div>
              <div className="confirm-texts">
                <p className="confirm-message">Are you sure you want to delete this account?</p>
                <p className="confirm-subtext">This action cannot be undone.</p>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteUser(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  await handleDeleteUser(confirmDeleteUser.id);
                  setConfirmDeleteUser(null);
                }}
                disabled={actionLoading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
