import { useState, useEffect } from 'react';
import '../styles/table.css';
import '../styles/content.css';

export default function Reporting({ token }) {
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState('');
  const [overDisposedCount, setOverDisposedCount] = useState(0);

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  const fetchInventoryReport = async () => {
    try {
      const res = await fetch('/api/report', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        const overDisposed = data.filter(item => item.quantity_disposed > item.quantity_ordered).length;
        setOverDisposedCount(overDisposed);
      } else {
        const error = await res.json();
        setMessage(error.error || 'Failed to load report');
      }
    } catch (err) {
      setMessage('Failed to load report');
    }
  };

  return (
    <div className="content-section">
      <h2>Inventory Report</h2>
      {message && <p className="error-message">{message}</p>}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NDC</th>
              <th>Drug Name</th>
              <th>Manufacturer</th>
              <th>Wholesaler</th>
              <th>Ordered</th>
              <th>Disposed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr
                key={item.id}
                className={
                  item.quantity_disposed > item.quantity_ordered
                    ? 'status-red'
                    : 'status-green'
                }
              >
                <td>{item.ndc}</td>
                <td>{item.drug_name}</td>
                <td>{item.manufacturer}</td>
                <td>{item.wholesaler}</td>
                <td>{item.quantity_ordered}</td>
                <td>{item.quantity_disposed || 0}</td>
                <td>
                  {item.quantity_disposed > item.quantity_ordered ? (
                    <span className="status-text">Over-disposed</span>
                  ) : (
                    <span className="status-text">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
