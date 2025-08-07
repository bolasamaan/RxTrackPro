import { useState, useEffect } from 'react';
import '../styles/table.css';
import '../styles/content.css';

export default function DispositionTracking({ token }) {
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Failed to load inventory');
      }
    } catch (err) {
      setMessage('Failed to load inventory');
    }
  };

  const updateDisposition = async (inventoryId, quantity) => {
    try {
      const res = await fetch('/api/disposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ inventoryId, quantity })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Disposition updated successfully');
        fetchInventory();
      } else {
        const errorMsg = data.error || 'Failed to update disposition';
        console.error('Disposition update failed:', errorMsg);
        setMessage(errorMsg);
      }
    } catch (err) {
      console.error('Disposition update error:', err);
      setMessage('Error updating disposition');
    }
  };

  return (
    <div className="content-section">
      <h2>Disposition Tracking</h2>
      <p className="section-description">
        Update the disposed quantities for your inventory items. Enter the amount disposed 
        for each item and the system will automatically update the records.
      </p>
      {message && (
        <div className={`alert ${message.includes('success') ? 'success-message' : 'error-message'}`}>
          {message}
        </div>
      )}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>NDC</th>
              <th>Drug Name</th>
              <th>Wholesaler</th>
              <th>Ordered</th>
              <th>Disposed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No inventory items found. Please upload inventory first.
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.ndc}</td>
                  <td>{item.drug_name}</td>
                  <td>{item.wholesaler}</td>
                  <td>{item.quantity_ordered}</td>
                  <td>{item.quantity_disposed || 0}</td>
                  <td>
                    <div className="disposition-input">
                      <input
                        type="number"
                        min="0"
                        className={`quantity-input ${item.quantity_disposed > item.quantity_ordered ? 'over-disposed' : ''}`}
                        placeholder="Amount"
                        defaultValue={item.quantity_disposed || 0}
                        onBlur={(e) => {
                          const value = e.target.value;
                          const dispositionAmount = parseInt(value) || 0;
                          if (dispositionAmount >= 0) {
                            if (dispositionAmount > item.quantity_ordered) {
                              if (confirm(`Warning: The disposed amount (${dispositionAmount}) is greater than the ordered amount (${item.quantity_ordered}). This will be flagged in the report. Continue?`)) {
                                updateDisposition(item.id, dispositionAmount);
                              } else {
                                e.target.value = item.quantity_disposed || 0;
                              }
                            } else {
                              updateDisposition(item.id, dispositionAmount);
                            }
                          } else {
                            e.target.value = item.quantity_disposed || 0;
                            setMessage('Disposition amount cannot be negative');
                          }
                        }}
                      />
                      {item.quantity_disposed > item.quantity_ordered && (
                        <div className="warning-text">Over-disposed</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
