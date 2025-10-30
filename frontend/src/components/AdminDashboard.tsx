import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const AdminDashboard: React.FC = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className="alert alert-danger mt-4">Access Denied: You must be an administrator to view this page.</div>;
  }

  return (
    <div className="container mt-4">
      <h1>Admin Dashboard</h1>
      <p>Welcome to the administration panel. From here you can manage users and lessons.</p>
      <div className="list-group">
        <Link to="/admin/users" className="list-group-item list-group-item-action">
          User Management
        </Link>
        <Link to="/admin/lessons" className="list-group-item list-group-item-action">
          Lesson Management
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
