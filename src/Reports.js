import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

function Reports() {
  // State variables for different metrics
  const [dailyPrints, setDailyPrints] = useState([]);
  const [paperConsumption, setPaperConsumption] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [fileTypeDistribution, setFileTypeDistribution] = useState([]);
  const [dateRange, setDateRange] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  useEffect(() => {
    fetchReportData(dateRange);
  }, [dateRange]);

  const fetchReportData = async (range) => {
    setIsLoading(true);
    
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      if (range === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (range === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (range === 'year') {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }
      
      // Query for print requests in the date range
      const printsQuery = query(
        collection(db, 'printRequests'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(printsQuery);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Process data for different charts
      processDataForCharts(requests, range);
      
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processDataForCharts = (requests, range) => {
    // Process daily prints data
    const dailyData = getDailyPrintCounts(requests, range);
    setDailyPrints(dailyData);
    
    // Process paper consumption data
    const paperData = getPaperConsumption(requests, range);
    setPaperConsumption(paperData);
    
    // Process status distribution
    const statusData = getStatusDistribution(requests);
    setStatusDistribution(statusData);
    
    // Process top users
    const userData = getTopUsers(requests);
    setTopUsers(userData);
    
    // Process file type distribution
    const fileTypeData = getFileTypeDistribution(requests);
    setFileTypeDistribution(fileTypeData);
  };

  // Helper function to group data by date and count prints
  const getDailyPrintCounts = (requests, range) => {
    const dateFormat = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateFormatShort = { month: 'short', day: 'numeric' };
    
    // Group by date
    const groupedByDate = {};
    
    requests.forEach(req => {
      const date = req.timestamp;
      let dateStr;
      
      if (range === 'week') {
        dateStr = date.toLocaleDateString('en-US', dateFormat);
      } else if (range === 'month') {
        dateStr = date.toLocaleDateString('en-US', dateFormatShort);
      } else {
        dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = { date: dateStr, prints: 0, pages: 0 };
      }
      
      groupedByDate[dateStr].prints += 1;
      groupedByDate[dateStr].pages += (req.pageCount || 1) * (req.copies || 1);
    });
    
    return Object.values(groupedByDate);
  };

  // Helper function to calculate paper consumption
  const getPaperConsumption = (requests, range) => {
    // Start with the daily print counts
    const dailyData = getDailyPrintCounts(requests, range);
    
    // Calculate cumulative consumption
    let cumulative = 0;
    return dailyData.map(day => {
      cumulative += day.pages;
      return {
        ...day,
        cumulative
      };
    });
  };

  // Helper function to get status distribution
  const getStatusDistribution = (requests) => {
    const statusCounts = {};
    
    requests.forEach(req => {
      const status = req.status || 'unknown';
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status] += 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  // Helper function to get top users
  const getTopUsers = (requests) => {
    const userCounts = {};
    
    requests.forEach(req => {
      const email = req.studentEmail || 'unknown';
      if (!userCounts[email]) {
        userCounts[email] = 0;
      }
      userCounts[email] += (req.pageCount || 1) * (req.copies || 1);
    });
    
    // Sort users by print count and take top 5
    return Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  };

  // Helper function to get file type distribution
  const getFileTypeDistribution = (requests) => {
    const typeCounts = {};
    
    requests.forEach(req => {
      let fileType = 'other';
      const fileName = req.fileDetails;
      
      if (fileName) {
        if (fileName.toLowerCase().endsWith('.pdf')) {
          fileType = 'PDF';
        } else if (fileName.toLowerCase().match(/\.(docx|doc)$/)) {
          fileType = 'Word';
        } else if (fileName.toLowerCase().match(/\.(pptx|ppt)$/)) {
          fileType = 'PowerPoint';
        } else if (fileName.toLowerCase().match(/\.(xlsx|xls)$/)) {
          fileType = 'Excel';
        } else if (fileName.toLowerCase().match(/\.(jpeg|jpg|png|gif)$/)) {
          fileType = 'Image';
        }
      }
      
      if (!typeCounts[fileType]) {
        typeCounts[fileType] = 0;
      }
      typeCounts[fileType] += 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  };

  // Helper function for Pie Chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="title-section">
          <span className="section-icon">📊</span>
          <h2>Print Reports & Analytics</h2>
        </div>
        <div className="date-filter">
          <button 
            className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => setDateRange('week')}
          >
            This Week
          </button>
          <button 
            className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => setDateRange('month')}
          >
            This Month
          </button>
          <button 
            className={`filter-btn ${dateRange === 'year' ? 'active' : ''}`}
            onClick={() => setDateRange('year')}
          >
            This Year
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-spinner">
          <p>Loading reports data...</p>
        </div>
      ) : (
        <div className="reports-grid">
          {/* Daily Prints Chart */}
          <div className="report-card">
            <div className="card-header">
              <h3>Daily Print Jobs</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dailyPrints}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Print Jobs', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="prints" name="Print Jobs" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Paper Consumption Chart */}
          <div className="report-card">
            <div className="card-header">
              <h3>Paper Consumption</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={paperConsumption}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Pages', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Cumulative', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="pages" name="Pages" fill="#82ca9d" />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cumulative" 
                    name="Cumulative Pages" 
                    stroke="#ff7300"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="report-card">
            <div className="card-header">
              <h3>Print Status Distribution</h3>
            </div>
            <div className="card-body pie-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Users Chart */}
          <div className="report-card">
            <div className="card-header">
              <h3>Top Users by Pages Printed</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topUsers}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Pages Printed" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* File Type Distribution */}
          <div className="report-card">
            <div className="card-header">
              <h3>File Type Distribution</h3>
            </div>
            <div className="card-body pie-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={fileTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fileTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Stats Card */}
          <div className="report-card summary-card">
            <div className="card-header">
              <h3>Printing Summary</h3>
            </div>
            <div className="card-body">
              <div className="summary-stats">
                <div className="summary-stat">
                  <div className="stat-icon prints-icon">🖨️</div>
                  <div className="stat-details">
                    <h4>Total Print Jobs</h4>
                    <p className="stat-value">{dailyPrints.reduce((sum, day) => sum + day.prints, 0)}</p>
                  </div>
                </div>
                <div className="summary-stat">
                  <div className="stat-icon pages-icon">📄</div>
                  <div className="stat-details">
                    <h4>Total Pages</h4>
                    <p className="stat-value">
                      {paperConsumption.length > 0 ? paperConsumption[paperConsumption.length - 1].cumulative : 0}
                    </p>
                  </div>
                </div>
                <div className="summary-stat">
                  <div className="stat-icon users-icon">👥</div>
                  <div className="stat-details">
                    <h4>Active Users</h4>
                    <p className="stat-value">{Object.keys(
                      dailyPrints.reduce((acc, day) => {
                        day.users?.forEach(user => acc[user] = true);
                        return acc;
                      }, {})
                    ).length}</p>
                  </div>
                </div>
                <div className="summary-stat">
                  <div className="stat-icon avg-icon">📊</div>
                  <div className="stat-details">
                    <h4>Avg. Pages per Print</h4>
                    <p className="stat-value">
                      {dailyPrints.reduce((sum, day) => sum + day.prints, 0) > 0
                        ? (paperConsumption.reduce((sum, day) => sum + day.pages, 0) / 
                           dailyPrints.reduce((sum, day) => sum + day.prints, 0)).toFixed(1)
                        : "0"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;