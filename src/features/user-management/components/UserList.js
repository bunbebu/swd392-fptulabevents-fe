import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../../api';
import UserForm from '../admin/UserForm';
import UserStatusForm from '../admin/UserStatusForm';
import CreateUser from '../admin/CreateUser';
import EditUser from '../admin/EditUser';
import UserDetail from './UserDetail';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showDetailPage, setShowDetailPage] = useState(false);
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

  // Load users
  const loadUsers = useCallback(async (page = currentPage, isPagination = false) => {
    try {
      // Only show main loading on initial load, not on pagination
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
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
        console.log('UserList - Normalizing user roles:', {
          userId: u.id,
          username: u.username,
          originalRoles: u.roles,
          roleNames: u.roleNames,
          Roles: u.Roles,
          allUserKeys: Object.keys(u)
        });
        
        const rawRoles = Array.isArray(u.roles) ? u.roles
          : (Array.isArray(u.roleNames) ? u.roleNames
          : (Array.isArray(u.Roles) ? u.Roles.map(r => r?.name || r?.roleName || r) : []));
        
        console.log('UserList - Normalized roles result:', {
          userId: u.id,
          username: u.username,
          normalizedRoles: rawRoles
        });
        
        return { ...u, roles: rawRoles };
      };
      setUsers(list.map(normalizeRoles));
      setTotalPages(totalPagesFromApi || 1);
      setTotalUsers(totalCountFromApi || list.length || 0);
    } catch (err) {
      setError(err.message || 'Error occurred while loading user list');
      setUsers([]);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [pageSize, currentPage]);

  useEffect(() => {
    loadUsers(1, false); // false indicates this is initial load
  }, [loadUsers]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadUsers(newPage, true); // true indicates this is pagination
    }
  };

  // Handle create user with optimistic update
  // CRUD operation handlers
  const handleCreateUserSuccess = async () => {
    setShowCreatePage(false);
    showToast('User created successfully!', 'success');
    await loadUsers(currentPage);
  };

  const handleEditUserSuccess = async () => {
    setShowEditPage(false);
    setSelectedUser(null);
    showToast('User updated successfully!', 'success');
    await loadUsers(currentPage);
  };

  const handleCreateUser = async (userData) => {
    // Create optimistic user object
    const optimisticUser = {
      id: `temp-${Date.now()}`, // Temporary ID
      email: userData.email,
      username: userData.username,
      fullname: userData.fullname,
      mssv: userData.mssv,
      roles: userData.roles,
      status: 'Active',
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Add to current page if there's space
    if (users.length < pageSize) {
      setUsers(prev => [...prev, optimisticUser]);
      setTotalUsers(prev => prev + 1);
    }

    try {
      const newUser = await userApi.createUser(userData);
      
      // Replace optimistic user with real user
      setUsers(prev => prev.map(user => 
        user.isOptimistic && user.id === optimisticUser.id 
          ? { ...newUser, isOptimistic: false }
          : user
      ));
    } catch (error) {
      // Remove optimistic user on error
      setUsers(prev => prev.filter(user => user.id !== optimisticUser.id));
      setTotalUsers(prev => prev - 1);
      throw error; // Re-throw to trigger error handling
    }
  };

  // Handle edit user with optimistic update
  const handleEditUser = async (userData) => {
    const originalUser = users.find(u => u.id === selectedUser.id);
    
    // Create optimistic update
    const optimisticUser = {
      ...originalUser,
      fullname: userData.fullname,
      mssv: userData.mssv,
      roles: userData.roles,
      isOptimistic: true
    };

    // Update UI immediately
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id ? optimisticUser : user
    ));

    try {
      const updatedUser = await userApi.updateUser(selectedUser.id, userData);
      
      // Replace with real updated user
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...updatedUser, isOptimistic: false }
          : user
      ));
    } catch (error) {
      // Revert to original user on error
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? originalUser : user
      ));
      throw error; // Re-throw to trigger error handling
    }
  };

  // Success callbacks for UserForm
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    showToast('User created successfully!', 'success');
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    showToast('User updated successfully!', 'success');
  };

  // Error callbacks for UserForm
  const handleCreateError = (error) => {
    showToast(error.message || 'Failed to create user', 'error');
  };

  const handleEditError = (error) => {
    showToast(error.message || 'Failed to update user', 'error');
  };

  // Handle delete user with optimistic update
  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    // Remove from UI immediately
    setUsers(prev => prev.filter(user => user.id !== userId));
    setTotalUsers(prev => prev - 1);

    try {
      await userApi.deleteUser(userId);
      showToast('User deleted successfully!', 'success');
    } catch (err) {
      // Restore user on error
      setUsers(prev => [...prev, userToDelete]);
      setTotalUsers(prev => prev + 1);
      showToast(err.message || 'Failed to delete user', 'error');
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
    setShowEditPage(true);
  };

  // Open user detail page
  const openUserDetail = (user) => {
    setSelectedUser(user);
    setShowDetailPage(true);
  };

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
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      {showCreatePage ? (
        <CreateUser onNavigateBack={() => setShowCreatePage(false)} onSuccess={handleCreateUserSuccess} />
      ) : showEditPage ? (
        <EditUser user={selectedUser} onNavigateBack={() => {
          setShowEditPage(false);
          setSelectedUser(null);
        }} onSuccess={handleEditUserSuccess} />
      ) : showDetailPage ? (
        <UserDetail userId={selectedUser?.id} onNavigateBack={() => {
          setShowDetailPage(false);
          setSelectedUser(null);
        }} />
      ) : (
        <>
          <div className="user-list-header">
            <h2>User Management</h2>
            <button 
              className="btn-new-booking"
              onClick={() => setShowCreatePage(true)}
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Create New User
            </button>
          </div>

      {/* Success/Error Notification above table */}
      {toast && (
        <div 
          className="table-notification"
          style={{
            backgroundColor: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: toast.type === 'success' ? '#065f46' : '#dc2626',
            border: toast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {toast.type === 'success' ? (
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            ) : (
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            )}
          </svg>
          {toast.message}
        </div>
      )}

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
              <th className="col-email">Email</th>
              <th className="col-username">Username</th>
              <th className="col-fullname">Full name</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !paginationLoading ? (
              <tr>
                <td colSpan="6" className="loading-cell">
                  <div className="loading-spinner"></div>
                  Loading users...
                </td>
              </tr>
            ) : paginationLoading ? (
              // Show skeleton rows during pagination
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="skeleton-row">
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No user data
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={user.isOptimistic ? 'optimistic-row' : ''}>
                  <td className="col-email">{user.email}</td>
                  <td className="col-username">{user.username}</td>
                  <td className="col-fullname">{user.fullname}</td>
                  <td>
                    <div className="roles-container">
                      {(() => {
                        console.log('UserList - User roles debug:', {
                          userId: user.id,
                          username: user.username,
                          rawRoles: user.roles,
                          rolesType: typeof user.roles,
                          isArray: Array.isArray(user.roles),
                          rolesLength: user.roles?.length || 0
                        });
                        return user.roles?.map((role, index) => (
                          <span key={index} className="role-badge neutral">
                            {role}
                          </span>
                        ));
                      })()}
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
                        onClick={() => openUserDetail(user)}
                        disabled={actionLoading}
                        aria-label="View details"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-blue"
                        onClick={() => openEditModal(user)}
                        disabled={actionLoading}
                        aria-label="Edit user"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-purple"
                        onClick={() => handleToggleStatus(user)}
                        disabled={actionLoading}
                        aria-label="Toggle status"
                        title={(user.status || '').toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {(user.status || '').toLowerCase() === 'active' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v1"></path>
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-icon btn-icon-outline color-red"
                        onClick={() => setConfirmDeleteUser(user)}
                        disabled={actionLoading}
                        aria-label="Delete user"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                        </svg>
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
          disabled={currentPage === 1 || actionLoading || paginationLoading}
        >
          {paginationLoading && currentPage > 1 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Loading...
            </>
          ) : (
            'Previous'
          )}
        </button>
        <span className="page-info">
          Page {currentPage} / {totalPages}
          {paginationLoading && (
            <span className="pagination-loading-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </span>
          )}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || actionLoading || paginationLoading}
        >
          {paginationLoading && currentPage < totalPages ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Loading...
            </>
          ) : (
            'Next'
          )}
        </button>
      </div>

        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <UserForm
          title="Create new user"
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
          loading={actionLoading}
          onSuccess={handleCreateSuccess}
          onError={handleCreateError}
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
          onSuccess={handleEditSuccess}
          onError={handleEditError}
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
