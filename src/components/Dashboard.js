import React from 'react';

const Dashboard = ({ stats }) => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-container">
        <div className="stat-card">
          <h3>Pending</h3>
          <div className="stat-value pending">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <h3>Printing</h3>
          <div className="stat-value printing">{stats.printing}</div>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <div className="stat-value completed">{stats.completed}</div>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;