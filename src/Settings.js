import React, { useState, useEffect } from 'react';
import './Settings.css';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Settings() {
  // State for settings
  const [settings, setSettings] = useState({
    darkMode: false,
    notificationsEnabled: true,
    autoRefreshInterval: 5,
    defaultPageSize: 10,
    emailNotifications: true,
    lowTonerAlert: 20,
    pendingJobsLimit: 30,
    systemMaintenance: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // Fetch settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'adminSettings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : 
              value
    }));
  };

  // Save settings to Firestore
  const saveSettings = async () => {
    try {
      setSaveStatus('Saving...');
      setShowSaveMessage(true);
      
      const settingsRef = doc(db, 'adminSettings', 'general');
      await setDoc(settingsRef, settings, { merge: true });
      
      setSaveStatus('Settings saved successfully!');
      
      // Toggle dark mode
      if (settings.darkMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setShowSaveMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus('Error saving settings!');
      
      setTimeout(() => {
        setShowSaveMessage(false);
      }, 3000);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <span className="settings-icon">⚙️</span>
        <h2>System Settings</h2>
      </div>
      
      {showSaveMessage && (
        <div className={`save-message ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </div>
      )}
      
      <div className="settings-grid">
        {/* User Interface Settings Card */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🎨</span>
            <h3>User Interface</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="darkMode">Dark Mode</label>
                <p className="setting-description">Enable dark theme for the admin panel</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="darkMode"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="autoRefreshInterval">Auto-refresh Interval</label>
                <p className="setting-description">Time in minutes between dashboard refreshes</p>
              </div>
              <div className="setting-control">
                <select
                  id="autoRefreshInterval"
                  name="autoRefreshInterval"
                  value={settings.autoRefreshInterval}
                  onChange={handleInputChange}
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="defaultPageSize">Default Page Size</label>
                <p className="setting-description">Number of records per page</p>
              </div>
              <div className="setting-control">
                <select
                  id="defaultPageSize"
                  name="defaultPageSize"
                  value={settings.defaultPageSize}
                  onChange={handleInputChange}
                >
                  <option value={5}>5 records</option>
                  <option value={10}>10 records</option>
                  <option value={20}>20 records</option>
                  <option value={50}>50 records</option>
                  <option value={100}>100 records</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Settings Card */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🔔</span>
            <h3>Notifications</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="notificationsEnabled">Browser Notifications</label>
                <p className="setting-description">Enable desktop notifications for new print requests</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    name="notificationsEnabled"
                    checked={settings.notificationsEnabled}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="emailNotifications">Email Alerts</label>
                <p className="setting-description">Receive email notifications for high priority requests</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Printer Settings Card */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🖨️</span>
            <h3>Printer Management</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="lowTonerAlert">Low Toner Alert (%)</label>
                <p className="setting-description">Get notified when toner is below this percentage</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  id="lowTonerAlert"
                  name="lowTonerAlert"
                  min="5"
                  max="50"
                  value={settings.lowTonerAlert}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="pendingJobsLimit">Pending Jobs Limit</label>
                <p className="setting-description">Maximum number of jobs in the print queue</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  id="pendingJobsLimit"
                  name="pendingJobsLimit"
                  min="10"
                  max="100"
                  value={settings.pendingJobsLimit}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label htmlFor="systemMaintenance">Maintenance Mode</label>
                <p className="setting-description">Temporarily disable new print requests</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="systemMaintenance"
                    name="systemMaintenance"
                    checked={settings.systemMaintenance}
                    onChange={handleInputChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Backup & Advanced Card */}
        <div className="settings-card">
          <div className="card-header">
            <span className="card-icon">🔒</span>
            <h3>System & Backup</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <label>Data Backup</label>
                <p className="setting-description">Download a backup of all print history</p>
              </div>
              <div className="setting-control">
                <button className="backup-button">Export Data</button>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <label>Clear History</label>
                <p className="setting-description">Delete completed jobs older than 30 days</p>
              </div>
              <div className="setting-control">
                <button className="clear-button">Clear Old Data</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="save-button" onClick={saveSettings}>Save Settings</button>
        <button className="reset-button" onClick={() => window.location.reload()}>Reset Changes</button>
      </div>
    </div>
  );
}

export default Settings;