
import { useState, useEffect } from 'react';
import './styles/nav.css';

import Auth from './components/Auth';
import InventoryUpload from './components/InventoryUpload';
import DispositionTracking from './components/DispositionTracking';
import Reporting from './components/Reporting';
import UpdateNotification from './components/UpdateNotification';

function App() {
  // Try to get stored user data on initial load
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [page, setPage] = useState(window.location.hash.replace('#', '') || 'auth');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check token validity
  useEffect(() => {
    const checkAuth = async () => {
      if (user?.token) {
        try {
          const res = await fetch('/api/inventory', {
            headers: {
              Authorization: `Bearer ${user.token}`
            }
          });
          if (!res.ok) {
            setUser(null);
            localStorage.removeItem('user');
            window.location.hash = 'auth';
          }
        } catch (err) {
          setUser(null);
          localStorage.removeItem('user');
          window.location.hash = 'auth';
        }
      }
    };
    checkAuth();
  }, [user?.token]);

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash.replace('#', '') || 'auth');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="app-container">
      <UpdateNotification />
      <nav className="nav-container">
        <div className={`nav-content ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <a href="/" className="logo">PharmTrack</a>
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="nav-links" onClick={() => setIsMobileMenuOpen(false)}>
            {user ? (
              <>
                <a href="#upload" className={page === 'upload' ? 'active' : ''}>
                  Inventory Upload
                </a>
                <a href="#disposition" className={page === 'disposition' ? 'active' : ''}>
                  Disposition Tracking
                </a>
                <a href="#report" className={page === 'report' ? 'active' : ''}>
                  Reports
                </a>
              </>
            ) : (
              <a href="#auth" className="active">Sign In</a>
            )}
          </div>
          {user && (
            <div className="user-section">
              <span className="username">Welcome, {user.username}</span>
              <button 
                className="sign-out-btn"
                onClick={() => {
                  setUser(null);
                  localStorage.removeItem('user');
                  window.location.hash = 'auth';
                  setIsMobileMenuOpen(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="main-content">
        {!user && page === 'auth' ? (
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">Streamline Your Pharmacy Inventory Management</h1>
              <p className="hero-subtitle">
                Efficiently track, manage, and report on your pharmacy inventory with our modern solution.
              </p>
              <Auth onAuth={(userData) => {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                window.location.hash = 'upload';
              }} />
            </div>
          </div>
        ) : (
          <div className="content-wrapper">
            {user && page === 'upload' && <InventoryUpload token={user?.token} />}
            {user && page === 'disposition' && <DispositionTracking token={user?.token} />}
            {user && page === 'report' && <Reporting token={user?.token} />}
            {!user && page !== 'auth' && (
              <div className="hero-section">
                <h2>Please sign in to access this feature</h2>
                <a href="#auth" className="sign-out-btn">Sign In</a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
