import React, { useState } from 'react';

const RequestsTable = ({ 
  requests, 
  onSelectRequest, 
  onStartPrinting, 
  onMarkCompleted, 
  onCancelRequest 
}) => {
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (sortField === 'submittedAt' || sortField === 'completedAt' || sortField === 'startedAt') {
      return sortDirection === 'asc' 
        ? new Date(a[sortField]) - new Date(b[sortField])
        : new Date(b[sortField]) - new Date(a[sortField]);
    }
    
    if (typeof a[sortField] === 'string') {
      return sortDirection === 'asc'
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField]);
    }
    
    return sortDirection === 'asc'
      ? a[sortField] - b[sortField]
      : b[sortField] - a[sortField];
  });

  const filteredRequests = statusFilter === 'all' 
    ? sortedRequests 
    : sortedRequests.filter(request => request.status === statusFilter);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="requests-table-container">
      <div className="table-header">
        <h2>Print Requests</h2>
        <div className="table-controls">
          <div className="filter-controls">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="printing">Printing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      <table className="requests-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')}>
              Request ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('studentName')}>
              Student {sortField === 'studentName' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('fileName')}>
              File {sortField === 'fileName' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('pages')}>
              Pages {sortField === 'pages' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('copies')}>
              Copies {sortField === 'copies' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')}>
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('submittedAt')}>
              Submitted {sortField === 'submittedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length === 0 ? (
            <tr>
              <td colSpan="8" className="no-results">No print requests found</td>
            </tr>
          ) : (
            filteredRequests.map(request => (
              <tr 
                key={request.id} 
                className={`status-${request.status}`}
                onClick={() => onSelectRequest(request)}
              >
                <td>{request.id}</td>
                <td>{request.studentName} ({request.studentId})</td>
                <td>{request.fileName}</td>
                <td>{request.pages}</td>
                <td>{request.copies}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td>{formatDate(request.submittedAt)}</td>
                <td>
                  <div className="action-buttons">
                    {request.status === 'pending' && (
                      <button 
                        className="btn-start" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartPrinting(request.id);
                        }}
                      >
                        Start
                      </button>
                    )}
                    {request.status === 'printing' && (
                      <button 
                        className="btn-complete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkCompleted(request.id);
                        }}
                      >
                        Complete
                      </button>
                    )}
                    {(request.status === 'pending' || request.status === 'printing') && (
                      <button 
                        className="btn-cancel" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelRequest(request.id);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestsTable;