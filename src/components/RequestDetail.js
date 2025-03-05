import React from 'react';

const RequestDetail = ({ 
  request, 
  onStartPrinting, 
  onMarkCompleted, 
  onCancelRequest,
  onClose
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="request-detail-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Print Request Details - {request.id}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="detail-group">
            <h3>Student Information</h3>
            <div className="detail-row">
              <div className="detail-label">Name:</div>
              <div className="detail-value">{request.studentName}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">ID:</div>
              <div className="detail-value">{request.studentId}</div>
            </div>
          </div>
          
          <div className="detail-group">
            <h3>File Information</h3>
            <div className="detail-row">
              <div className="detail-label">File Name:</div>
              <div className="detail-value">{request.fileName}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">File Size:</div>
              <div className="detail-value">{request.fileSize}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Pages:</div>
              <div className="detail-value">{request.pages}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Copies:</div>
              <div className="detail-value">{request.copies}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Color:</div>
              <div className="detail-value">{request.color ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          <div className="detail-group">
            <h3>Status Information</h3>
            <div className="detail-row">
              <div className="detail-label">Current Status:</div>
              <div className="detail-value status-value">
                <span className={`status-badge status-${request.status}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Submitted At:</div>
              <div className="detail-value">{formatDate(request.submittedAt)}</div>
            </div>
            {request.startedAt && (
              <div className="detail-row">
                <div className="detail-label">Started At:</div>
                <div className="detail-value">{formatDate(request.startedAt)}</div>
              </div>
            )}
            {request.completedAt && (
              <div className="detail-row">
                <div className="detail-label">Completed At:</div>
                <div className="detail-value">{formatDate(request.completedAt)}</div>
              </div>
            )}
            {request.cancelledAt && (
              <div className="detail-row">
                <div className="detail-label">Cancelled At:</div>
                <div className="detail-value">{formatDate(request.cancelledAt)}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          {request.status === 'pending' && (
            <button className="btn-start" onClick={() => onStartPrinting(request.id)}>
              Start Printing
            </button>
          )}
          {request.status === 'printing' && (
            <button className="btn-complete" onClick={() => onMarkCompleted(request.id)}>
              Mark as Completed
            </button>
          )}
          {(request.status === 'pending' || request.status === 'printing') && (
            <button className="btn-cancel" onClick={() => onCancelRequest(request.id)}>
              Cancel Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
