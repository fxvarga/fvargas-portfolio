import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import '../styles/admin.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>CMS Admin</h1>
          <p>Content Management</p>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="admin-nav-icon">&#9632;</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/content"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="admin-nav-icon">&#9998;</span>
            Content
          </NavLink>

          <NavLink
            to="/admin/content/hero"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            Hero Section
          </NavLink>

          <NavLink
            to="/admin/content/about"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            About Section
          </NavLink>

          <NavLink
            to="/admin/content/services"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            Services
          </NavLink>

          <NavLink
            to="/admin/content/contact"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            Contact
          </NavLink>

          <NavLink
            to="/admin/content/navigation"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            Navigation
          </NavLink>

          <NavLink
            to="/admin/content/site-config"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: '2.5rem' }}
          >
            Site Config
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              {user ? getInitials(user.username) : '?'}
            </div>
            <div className="admin-user-details">
              <div className="admin-user-name">{user?.username || 'Unknown'}</div>
              <div className="admin-user-role">{user?.role || 'User'}</div>
            </div>
          </div>
          <button
            className="admin-btn admin-btn-secondary admin-btn-full admin-btn-sm"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
