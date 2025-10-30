import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';

interface User {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  is_admin: boolean;
}

const UserManagement: React.FC = () => {
  const { isLoggedIn, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/', {
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch users');
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchUsers();
    } else if (!isAdmin) {
      setError('You do not have administrative privileges to view this page.');
      setLoading(false);
    }
  }, [isLoggedIn, isAdmin]);

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user }); // Create a copy to edit
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${tokenType} ${token}`,
        },
        body: JSON.stringify(editingUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }

      fetchUsers(); // Refresh the user list
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');

    if (!token || !tokenType) {
      setError('Authentication token not found. Please log in.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `${tokenType} ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      fetchUsers(); // Refresh the user list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isLoggedIn) {
    return <div className="alert alert-warning mt-4">Please log in to view this page.</div>;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger mt-4">Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1>User Management</h1>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Name</th>
            <th>Active</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.name || 'N/A'}</td>
              <td>{user.is_active ? 'Yes' : 'No'}</td>
              <td>{user.is_admin ? 'Yes' : 'No'}</td>
              <td>
                <button className="btn btn-sm btn-info me-2" onClick={() => handleEditClick(user)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="editEmail" className="form-label">Email</label>
                  <input type="email" className="form-control" id="editEmail" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label htmlFor="editName" className="form-label">Name</label>
                  <input type="text" className="form-control" id="editName" value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" className="form-check-input" id="editIsActive" checked={editingUser.is_active} onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })} />
                  <label className="form-check-label" htmlFor="editIsActive">Is Active</label>
                </div>
                <div className="form-check mb-3">
                  <input type="checkbox" className="form-check-input" id="editIsAdmin" checked={editingUser.is_admin} onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })} />
                  <label className="form-check-label" htmlFor="editIsAdmin">Is Admin</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveUser}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
