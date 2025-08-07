import { useState } from 'react';
import '../styles/table.css';
import '../styles/content.css';
import '../styles/forms.css';

export default function InventoryUpload({ token }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      console.log('Uploading with token:', token); // Debug log
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Upload successful! ${data.inserted} new items added, ${data.updated} items updated. Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  return (
    <div className="content-section">
      <h2>Upload Inventory</h2>
      <p className="section-description">
        Upload your inventory Excel file using the template format. The file should include NDC, Drug Name, 
        Quantity Ordered, Dosage/Concentration, Manufacturer, and Wholesaler information.
      </p>
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-container">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={handleFileChange} 
            required 
            className="file-input"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Upload Inventory
        </button>
      </form>
      {message && (
        <p className={`message ${message.includes('success') ? 'success-message' : 'error-message'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
