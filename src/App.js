import React, { useState, useEffect } from 'react';
import './App.css';
import './Reports.css'; // Import the Reports CSS
import Reports from './Reports'; // Import the Reports component
import { db, storage } from './firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

function App() {
  // State for print requests
  const [printRequests, setPrintRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    printing: 0,
    completed: 0,
    totalStudents: 0,
  });
  const [currentDate, setCurrentDate] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // State for view management
  const [showComments, setShowComments] = useState({}); // State to track which comments are expanded

  // Set current date
  useEffect(() => {
    const today = new Date();
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    setCurrentDate(today.toLocaleDateString('en-US', options));
  }, []);

  // Fetch print requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      const requestsQuery = query(
        collection(db, 'printRequests'),
        orderBy('timestamp', 'desc')
      );

      // Real-time listener for print requests
      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));
        
        setPrintRequests(requests);
        setFilteredRequests(requests);
        updateStats(requests);
      });

      // Return unsubscribe function to clean up listener
      return unsubscribe;
    };

    fetchRequests();
  }, []);

  // Update filtered requests when search term changes
  useEffect(() => {
    const results = printRequests.filter(request => 
      request.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fileDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.comments?.toLowerCase().includes(searchTerm.toLowerCase()) // Include comments in search
    );
    setFilteredRequests(results);
  }, [searchTerm, printRequests]);

  // Function to update stats
  const updateStats = (requests) => {
    const pending = requests.filter(req => req.status === 'pending').length;
    const printing = requests.filter(req => req.status === 'printing').length;
    const completed = requests.filter(req => req.status === 'completed').length;
    
    // Count unique students
    const uniqueStudents = new Set(requests.map(req => req.studentEmail));
    
    setStats({
      pending,
      printing,
      completed,
      totalStudents: uniqueStudents.size,
    });
  };

  // Handle status changes
  const changeStatus = async (id, newStatus) => {
    try {
      // Update document in Firestore
      const requestRef = doc(db, 'printRequests', id);
      await updateDoc(requestRef, { 
        status: newStatus,
        lastUpdated: new Date()
      });

      // Local state will be updated via the onSnapshot listener
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Handle request removal
  const removeRequest = async (id) => {
    try {
      // Delete document from Firestore
      await deleteDoc(doc(db, 'printRequests', id));
      
      // Local state will be updated via the onSnapshot listener
    } catch (error) {
      console.error("Error removing request:", error);
    }
  };

  // Render file icon based on file extension
  const renderFileIcon = (fileName) => {
    if (!fileName) return <span className="file-icon">📄</span>;
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <span className="file-icon pdf">📄</span>;
    } else if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      return <span className="file-icon doc">📄</span>;
    } else if (fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt')) {
      return <span className="file-icon ppt">📊</span>;
    } else {
      return <span className="file-icon">📄</span>;
    }
  };

  // Function to toggle comment visibility
  const toggleComments = (requestId) => {
    setShowComments(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  // Function to open file preview
  const handlePreviewFile = async (request) => {
    if (request.fileURLs && request.fileURLs.length > 0) {
      try {
        // First check if the URL is already in the request
        if (typeof request.fileURLs[0] === 'string' && request.fileURLs[0].startsWith('http')) {
          setPreviewFile({
            name: request.fileDetails,
            url: request.fileURLs[0],
            type: getFileType(request.fileDetails)
          });
        } else {
          // If not, try to get the download URL from Firebase Storage
          const fileRef = ref(storage, request.fileURLs[0]);
          const url = await getDownloadURL(fileRef);
          setPreviewFile({
            name: request.fileDetails,
            url: url,
            type: getFileType(request.fileDetails)
          });
        }
        setShowPreview(true);
      } catch (error) {
        console.error("Error getting file URL:", error);
        alert("Could not load file preview. The file may no longer exist.");
      }
    } else {
      alert("No file available to preview");
    }
  };

  // Helper function to determine file type for preview
  const getFileType = (fileName) => {
    if (!fileName) return 'unknown';
    
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    } else if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      return 'doc';
    } else if (fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt')) {
      return 'ppt';
    } else if (fileName.toLowerCase().match(/\.(jpeg|jpg|png|gif|bmp|svg)$/)) {
      return 'image';
    } else {
      return 'unknown';
    }
  };

  // Close the preview modal
  const closePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  // Function to render the dashboard view
  const renderDashboard = () => {
    return (
      <>
        {/* Top Header */}
        <div className="top-header">
          <div className="welcome-section">
            <span className="welcome-icon">👋</span>
            <div>
              <h2>Welcome, Admin</h2>
              <p className="date-display">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Title */}
        <div className="dashboard-title">
          <span className="dashboard-icon">📊</span>
          <h2>Print Queue Dashboard</h2>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon pending-card">
              <span>⏳</span>
            </div>
            <div className="stat-info">
              <h3>Pending Jobs</h3>
              <div className="stat-value">{stats.pending}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon printing-card">
              <span>🖨️</span>
            </div>
            <div className="stat-info">
              <h3>Printing</h3>
              <div className="stat-value">{stats.printing}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed-card">
              <span>✅</span>
            </div>
            <div className="stat-info">
              <h3>Completed</h3>
              <div className="stat-value">{stats.completed}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon students-card">
              <span>👥</span>
            </div>
            <div className="stat-info">
              <h3>Students</h3>
              <div className="stat-value">{stats.totalStudents}</div>
            </div>
          </div>
        </div>

        {/* Print Requests Section */}
        <div className="print-requests-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">📝</span>
              <h3>Print Requests</h3>
            </div>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, token number, comments or file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Student</th>
                  <th>File Details</th>
                  <th>Copies</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Comments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(request => (
                    <tr key={request.id} className={`request-row status-${request.status || 'pending'}`}>
                      <td className="token-column">
                        <span className="token-badge">{request.tokenNumber || 'N/A'}</span>
                      </td>
                      <td className="student-cell">
                        <div className="student-name">{request.studentName}</div>
                        <div className="student-email">{request.studentEmail}</div>
                      </td>
                      <td className="file-column">
                        <div className="file-info">
                          {renderFileIcon(request.fileDetails)}
                          <span className="file-name">{request.fileDetails}</span>
                          <button className="preview-button" onClick={() => handlePreviewFile(request)}>👁️</button>
                        </div>
                        <div className="file-meta">
                          {request.pageCount && <span>{request.pageCount} pages</span>}
                          {request.printColor && <span>{request.printColor}</span>}
                          {request.printSide && <span>{request.printSide}</span>}
                        </div>
                      </td>
                      <td>{request.copies || 1}</td>
                      <td className="time-cell">
                        <div className="timestamp">
                          {new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="datestamp">
                          {new Date(request.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${request.status || 'pending'}`}>
                          {request.status || 'pending'}
                        </span>
                      </td>
                      <td className="comments-cell">
                        {request.comments ? (
                          <div className="comments-container">
                            <button 
                              className="comments-toggle"
                              onClick={() => toggleComments(request.id)}
                            >
                              <span className="comments-icon">💬</span>
                              {showComments[request.id] ? 'Hide' : 'View'}
                            </button>
                            {showComments[request.id] && (
                              <div className="comments-content">
                                {request.comments}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="no-comments">None</span>
                        )}
                      </td>
                      <td className="action-column">
                        {request.status === 'pending' && (
                          <button className="action-button print" onClick={() => changeStatus(request.id, 'printing')}>
                            Print
                          </button>
                        )}
                        {request.status === 'printing' && (
                          <button className="action-button complete" onClick={() => changeStatus(request.id, 'completed')}>
                            Complete
                          </button>
                        )}
                        <button className="action-button cancel" onClick={() => removeRequest(request.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-table">
                      <div className="empty-message">
                        <span>📭</span>
                        <p>No print requests found{searchTerm ? " matching your search" : ""}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // Function to render the current view
  const renderCurrentView = () => {
    switch(currentView) {
      case 'reports':
        return <Reports />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };
  
  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="logo">
          <span className="logo-icon">🖨️</span>
          <h2>ADMIN PORTAL</h2>
        </div>
        <ul className="nav-links">
          <li className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <span className="nav-icon">📋</span>
            <span>Dashboard</span>
          </li>
          <li className={`nav-link ${currentView === 'reports' ? 'active' : ''}`} onClick={() => setCurrentView('reports')}>
            <span className="nav-icon">📊</span>
            <span>Reports</span>
          </li>
        </ul>
      </div>

      <div className="main-content">
        {/* File Preview Modal */}
        {showPreview && previewFile && (
          <div className="preview-modal">
            <div className="preview-content">
              <div className="preview-header">
                <h3>{previewFile.name}</h3>
                <button className="close-preview" onClick={closePreview}>×</button>
              </div>
              <div className="preview-body">
                {previewFile.type === 'pdf' && (
                  <iframe 
                    src={`${previewFile.url}#toolbar=0`} 
                    title="PDF Preview" 
                    className="pdf-preview"
                  />
                )}
                {previewFile.type === 'image' && (
                  <img src={previewFile.url} alt="File Preview" className="image-preview" />
                )}
                {(previewFile.type === 'doc' || previewFile.type === 'ppt' || previewFile.type === 'unknown') && (
                  <div className="generic-preview">
                    <p>Preview not available for this file type.</p>
                    <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="download-link">
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;