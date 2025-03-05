import React, { useState, useEffect } from 'react';
import './App.css';

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

  // Mock data for demonstration
  useEffect(() => {
    // Set current date
    const today = new Date();
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    setCurrentDate(today.toLocaleDateString('en-US', options));

    const mockData = [
      {
        id: 'PR001',
        studentName: 'Kevin Jacob',
        studentEmail: 'kevin@saintgits.org',
        fileDetails: 'Assignment1.pdf',
        copies: 2,
        status: 'pending',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'PR002',
        studentName: 'Jisa',
        studentEmail: 'Jisa@saintgits.org',
        fileDetails: 'ProjectReport.pdf',
        copies: 1,
        status: 'printing',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    // Use functional update to ensure single update
    setPrintRequests(prevRequests => {
      const uniqueNewRequests = mockData.filter(
        newReq => !prevRequests.some(existingReq => existingReq.id === newReq.id)
      );
      return [...prevRequests, ...uniqueNewRequests];
    });
    
    // Update filtered requests and stats with initial data
    setFilteredRequests(mockData);
    updateStats(mockData);

    // Simulate WebSocket connection for real-time updates
    const wsConnection = simulateWebSocket();
    
    return () => {
      // Clean up WebSocket connection
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Update filtered requests when search term changes
  useEffect(() => {
    const results = printRequests.filter(request => 
      request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fileDetails.toLowerCase().includes(searchTerm.toLowerCase())
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
      totalStudents: 150, // Mock value to match the screenshot
    });
  };

  // Simulate WebSocket connection for real-time updates
  const simulateWebSocket = () => {
    console.log("WebSocket connection established");
    
    // Simulate receiving a new print request after 5 seconds
    setTimeout(() => {
      const newRequest = {
        id: 'PR003',
        studentName: 'Smera',
        studentEmail: 'smera@saintgits.org',
        fileDetails: 'work.pdf',
        copies: 2,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      
      // Use functional update with check to prevent duplicates
      setPrintRequests(prev => {
        // Check if the request already exists
        const isDuplicate = prev.some(req => req.id === newRequest.id);
        
        // Only add if not a duplicate
        if (!isDuplicate) {
          const updated = [...prev, newRequest];
          updateStats(updated);
          return updated;
        }
        
        // Return previous state if duplicate
        return prev;
      });
      
    }, 5000);
    
    return {
      close: () => console.log("WebSocket connection closed"),
    };
  };

  // Handle status changes
  const changeStatus = (id, newStatus) => {
    setPrintRequests(prev => {
      const updated = prev.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      );
      updateStats(updated);
      return updated;
    });
  };

  // Render file icon based on file extension
  const renderFileIcon = (fileName) => {
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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <span className="logo-icon">🖨️</span>
          <h2>PORTAL</h2>
        </div>
        <ul className="nav-links">
          <li className="nav-link active">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </li>
          {/* Additional menu items */}
          <li className="nav-link">
            <span className="nav-icon">📋</span>
            <span>Reports</span>
          </li>
          <li className="nav-link">
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </li>
        </ul>
        <div className="nav-footer">
          <li className="nav-link">
            <span className="nav-icon">🚪</span>
            <span>EXIT</span>
          </li>
        </div>
      </div>
      
      {/* Main content */}
      <div className="main-content">
        <header className="top-header">
          <div className="welcome-section">
            <span className="welcome-icon">👋</span>
            <h3>Welcome</h3>
          </div>
          <div className="date-display">
            {currentDate}
          </div>
        </header>
        
        <div className="dashboard-title">
          <span className="dashboard-icon">📊</span>
          <h2>DASHBOARD</h2>
        </div>
        
        {/* Stats cards */}
        <div className="stats-container">
          <div className="stat-card pending-card">
            <div className="stat-icon">⌛</div>
            <div className="stat-info">
              <h3>Pending</h3>
              <p className="stat-value">{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card printing-card">
            <div className="stat-icon">🖨️</div>
            <div className="stat-info">
              <h3>Printing</h3>
              <p className="stat-value">{stats.printing}</p>
            </div>
          </div>
          <div className="stat-card completed-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Completed</h3>
              <p className="stat-value">{stats.completed}</p>
            </div>
          </div>
          <div className="stat-card students-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <p className="stat-value">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        {/* Print requests section */}
        <div className="print-requests-section">
          <div className="section-header">
            <div className="section-title">
              <span className="section-icon">🖨️</span>
              <h3>Printing Requests</h3>
            </div>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student</th>
                  <th>File</th>
                  <th>Copies</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="request-row">
                    <td className="id-column">{request.id}</td>
                    <td className="student-column">{request.studentEmail}</td>
                    <td className="file-column">
                      {renderFileIcon(request.fileDetails)}
                      {request.fileDetails}
                    </td>
                    <td className="copies-column">
                      {request.copies} {request.copies === 1 ? '(1page)' : '(10pages)'}
                    </td>
                    <td className="status-column">
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="action-column">
                      {request.status === 'pending' && (
                        <button 
                          className="action-button print"
                          onClick={() => changeStatus(request.id, 'printing')}
                        >
                          Print
                        </button>
                      )}
                      {request.status === 'printing' && (
                        <button 
                          className="action-button complete"
                          onClick={() => changeStatus(request.id, 'completed')}
                        >
                          Complete
                        </button>
                      )}
                      <button 
                        className="action-button cancel"
                        onClick={() => changeStatus(request.id, 'removed')}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;