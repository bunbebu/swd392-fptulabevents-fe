import React, { useState, useEffect, useCallback } from 'react';
import { labMembersApi, userApi } from '../../../api';

/**
 * Lab Member List Component
 * Displays and manages members within a specific lab
 * Integrated into Lab details view - no separate tab needed
 *
 * Related User Stories:
 * - US-09: Admin - Manage labs and equipment (includes lab member management)
 */
const LabMemberList = ({ labId, isAdmin = false }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('0'); // Default to Lead (0)
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    // Scroll to top of the lab members section to show toast
    setTimeout(() => {
      const labMemberSection = document.querySelector('.lab-member-list');
      if (labMemberSection) {
        labMemberSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);

    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 5000);
  };

  const loadMembers = useCallback(async () => {
    if (!labId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await labMembersApi.getLabMembers(labId);
      const membersList = (data && (data.data || data.Data)) || data || [];
      const membersArray = Array.isArray(membersList) ? membersList : [];

      // Enrich members with user details if email/username are missing
      const enrichedMembers = await Promise.all(
        membersArray.map(async (member) => {
          // If member already has email and username, no need to fetch
          if ((member.email || member.Email) && (member.username || member.Username)) {
            return member;
          }

          // Fetch user details
          const userId = member.userId || member.UserId;
          if (!userId) return member;

          try {
            const userDetails = await userApi.getUserById(userId);
            return {
              ...member,
              email: userDetails.email || userDetails.Email,
              username: userDetails.username || userDetails.Username
            };
          } catch (err) {
            console.warn(`Failed to fetch user details for ${userId}:`, err.message);
            return member;
          }
        })
      );

      setMembers(enrichedMembers);
    } catch (err) {
      console.error('Error loading lab members:', err);
      setError(err.message || 'Failed to load lab members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  const loadAvailableUsers = useCallback(async () => {
    try {
      const data = await userApi.getAllUsersUnpaged();
      const usersList = (data && (data.data || data.Data)) || data || [];

      // Filter out users who are already members
      const memberUserIds = new Set(members.map(m => m.userId || m.UserId));
      const available = (Array.isArray(usersList) ? usersList : [])
        .filter(user => !memberUserIds.has(user.id || user.Id));

      setAvailableUsers(available);
    } catch (err) {
      console.error('Error loading available users:', err);
      setError('Failed to load available users');
    }
  }, [members]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (showAddModal) {
      loadAvailableUsers();
    }
  }, [showAddModal, loadAvailableUsers]);

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError('Please select a user to add');
      return;
    }

    try {
      setError(null);

      // Step 1: Add member to lab
      const newMember = await labMembersApi.addLabMember(labId, selectedUserId);
      const memberId = newMember.id || newMember.Id;

      // Step 2: Update role (and set status to Active by default)
      try {
        await labMembersApi.updateLabMember(labId, memberId, {
          role: parseInt(selectedRole),
          status: 0 // Active
        });
      } catch (updateErr) {
        console.warn('Failed to update role, but member was added:', updateErr);
      }

      setShowAddModal(false);
      setSelectedUserId('');
      setSelectedRole('0'); // Reset to default
      setSearchQuery('');
      showToast('Member added successfully!', 'success');
      await loadMembers();
    } catch (err) {
      console.error('Error adding lab member:', err);
      setError(err.message || 'Failed to add member to lab');
      showToast(err.message || 'Failed to add member to lab', 'error');
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();

    if (!selectedMember) return;

    try {
      setError(null);

      console.log('Updating member with data:', {
        labId,
        memberId: selectedMember.id,
        role: selectedMember.role,
        status: selectedMember.status,
        roleType: typeof selectedMember.role,
        statusType: typeof selectedMember.status
      });

      await labMembersApi.updateLabMember(labId, selectedMember.id, {
        role: selectedMember.role,
        status: selectedMember.status
      });
      setShowUpdateModal(false);
      setSelectedMember(null);
      showToast('Member updated successfully!', 'success');
      await loadMembers();
    } catch (err) {
      console.error('Error updating lab member:', err);
      setError(err.message || 'Failed to update member');
      showToast(err.message || 'Failed to update member', 'error');
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmDeleteMember) return;

    const memberId = confirmDeleteMember.id;
    const memberToDelete = members.find(m => (m.id || m.Id) === memberId);

    // Optimistically remove from UI
    setMembers(prev => prev.filter(m => (m.id || m.Id) !== memberId));

    try {
      setError(null);
      await labMembersApi.removeLabMember(labId, memberId);
      setConfirmDeleteMember(null);
      showToast('Member removed successfully!', 'success');
    } catch (err) {
      // Restore member on error
      setMembers(prev => [...prev, memberToDelete]);
      console.error('Error removing lab member:', err);
      setError(err.message || 'Failed to remove member from lab');
      showToast(err.message || 'Failed to remove member from lab', 'error');
      setConfirmDeleteMember(null);
    }
  };

  const openUpdateModal = (member) => {
    const role = member.role ?? member.Role ?? 0;
    const status = member.status ?? member.Status ?? 0;

    setSelectedMember({
      id: member.id || member.Id,
      userId: member.userId || member.UserId,
      role: typeof role === 'number' ? role : 0,
      status: typeof status === 'number' ? status : 0
    });
    setShowUpdateModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to convert role number to label
  const getRoleLabel = (role) => {
    if (typeof role === 'string') return role;
    const roleMap = {
      0: 'Lead',
      1: 'Assistant',
      2: 'Member'
    };
    return roleMap[role] ?? 'Member';
  };

  // Helper function to convert status number to label
  const getStatusLabel = (status) => {
    if (typeof status === 'string') return status;
    const statusMap = {
      0: 'Active',
      1: 'Inactive'
    };
    return statusMap[status] ?? 'Active';
  };

  // Helper function to get CSS class for status
  const getStatusClass = (status) => {
    const label = getStatusLabel(status);
    return label.toLowerCase();
  };

  const filteredUsers = searchQuery
    ? availableUsers.filter(user => {
        const name = (user.fullname || user.Fullname || '').toLowerCase();
        const email = (user.email || user.Email || '').toLowerCase();
        const username = (user.username || user.Username || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query) || username.includes(query);
      })
    : availableUsers;

  if (loading) {
    return <div className="loading">Loading lab members...</div>;
  }

  return (
    <>
      <div className="detail-card-header">
        <h3>Lab Members ({members.length})</h3>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            title="Add Member to Lab"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Add Member
          </button>
        )}
      </div>

      {toast && (
        <div
          className="table-notification"
          style={{
            backgroundColor: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: toast.type === 'success' ? '#065f46' : '#dc2626',
            border: toast.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '1.5rem 1.5rem 0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px',
              marginLeft: '12px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="lab-member-list">

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {members.length === 0 ? (
        <div className="no-data">
          <p>No members in this lab yet.</p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="members-table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined At</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id || member.Id}>
                  <td>{member.fullname || member.Fullname || member.userName || member.UserName || 'N/A'}</td>
                  <td>{member.email || member.Email || member.userEmail || member.UserEmail || 'N/A'}</td>
                  <td>{member.username || member.Username || 'N/A'}</td>
                  <td>
                    <span className="role-badge">
                      {getRoleLabel(member.role ?? member.Role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${getStatusClass(member.status ?? member.Status)}`}>
                      {getStatusLabel(member.status ?? member.Status)}
                    </span>
                  </td>
                  <td>{formatDate(member.joinedAt || member.JoinedAt)}</td>
                  {isAdmin && (
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openUpdateModal(member)}
                          title="Update Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => setConfirmDeleteMember({
                            id: member.id || member.Id,
                            name: member.fullname || member.Fullname || member.userName || member.UserName || 'Unknown'
                          })}
                          title="Remove Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Member to Lab</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="userSearch">Search User:</label>
                  <input
                    type="text"
                    id="userSearch"
                    className="form-control"
                    placeholder="Search by name, email, or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="userId">Select User: <span className="required-asterisk">*</span></label>
                  <select
                    id="userId"
                    className="form-control"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a user --</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id || user.Id} value={user.id || user.Id}>
                        {(user.fullname || user.Fullname)} - {(user.email || user.Email)}
                      </option>
                    ))}
                  </select>
                  {filteredUsers.length === 0 && (
                    <small className="form-hint">
                      {searchQuery ? 'No users found matching your search.' : 'No available users to add.'}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="memberRole">Role: <span className="required-asterisk">*</span></label>
                  <select
                    id="memberRole"
                    className="form-control"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="0">Lead</option>
                    <option value="1">Assistant</option>
                    <option value="2">Member</option>
                  </select>
                  <small className="form-hint">
                    Select the role for this member in the lab
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedUserId}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Member Modal */}
      {showUpdateModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Member</h2>
              <button
                className="modal-close"
                onClick={() => setShowUpdateModal(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="updateMemberRole">Role:</label>
                  <select
                    id="updateMemberRole"
                    className="form-control"
                    value={selectedMember.role ?? 0}
                    onChange={(e) => setSelectedMember({ ...selectedMember, role: parseInt(e.target.value) })}
                  >
                    <option value="0">Lead</option>
                    <option value="1">Assistant</option>
                    <option value="2">Member</option>
                  </select>
                  <small className="form-hint">Specify the member's role in the lab</small>
                </div>
                <div className="form-group">
                  <label htmlFor="updateMemberStatus">Status:</label>
                  <select
                    id="updateMemberStatus"
                    className="form-control"
                    value={selectedMember.status ?? 0}
                    onChange={(e) => setSelectedMember({ ...selectedMember, status: parseInt(e.target.value) })}
                  >
                    <option value="0">Active</option>
                    <option value="1">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteMember && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Remove Member</h2>
              <button
                className="modal-close"
                onClick={() => setConfirmDeleteMember(null)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove <strong>{confirmDeleteMember.name}</strong> from this lab?</p>
              <p className="text-muted small" style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteMember(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRemoveMember}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default LabMemberList;
