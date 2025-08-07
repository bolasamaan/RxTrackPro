import { useState, useEffect } from 'react';
import './UpdateNotification.css';

const { ipcRenderer } = window.require('electron');

export default function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Listen for update messages
    ipcRenderer.on('update-message', (_, message) => {
      setUpdateStatus(message);
      setShowNotification(true);
    });

    ipcRenderer.on('update-available', (_, info) => {
      setUpdateStatus(`New version ${info.version} available`);
      setShowNotification(true);
    });

    ipcRenderer.on('update-not-available', () => {
      setUpdateStatus('You have the latest version');
      setTimeout(() => setShowNotification(false), 3000);
    });

    ipcRenderer.on('update-error', (_, error) => {
      setUpdateStatus(`Error: ${error}`);
      setTimeout(() => setShowNotification(false), 5000);
    });

    ipcRenderer.on('update-progress', (_, progressObj) => {
      setProgress(progressObj.percent);
      setUpdateStatus(`Downloading update: ${Math.round(progressObj.percent)}%`);
    });

    ipcRenderer.on('update-downloaded', () => {
      setUpdateStatus('Update ready to install');
    });

    return () => {
      ipcRenderer.removeAllListeners('update-message');
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('update-not-available');
      ipcRenderer.removeAllListeners('update-error');
      ipcRenderer.removeAllListeners('update-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
    };
  }, []);

  const handleDownload = () => {
    ipcRenderer.send('start-download');
  };

  const handleInstall = () => {
    ipcRenderer.send('install-update');
  };

  const handleCheck = () => {
    ipcRenderer.send('check-for-updates');
  };

  if (!showNotification) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <span>{updateStatus}</span>
        {progress > 0 && progress < 100 && (
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }} />
          </div>
        )}
        {updateStatus?.includes('available') && (
          <button onClick={handleDownload}>Download Update</button>
        )}
        {updateStatus?.includes('ready') && (
          <button onClick={handleInstall}>Install & Restart</button>
        )}
        <button className="check-updates" onClick={handleCheck}>
          Check for Updates
        </button>
        <button className="close" onClick={() => setShowNotification(false)}>
          ×
        </button>
      </div>
    </div>
  );
}
