import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { useAuth } from '../auth/AuthContext';
import { usePortfolio } from '../auth/PortfolioContext';
import Icon from '@mui/material/Icon';
import '../styles/admin.css';

interface EntityDefinitionNav {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  icon?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const GET_ALL_ENTITY_DEFINITIONS = gql`
  query GetAllEntityDefinitions {
    allEntityDefinitions {
      id
      name
      displayName
      category
      icon
    }
  }
`;

// Fallback content types when no entity definitions are loaded
const FALLBACK_CONTENT_TYPES = [
  { name: 'hero', displayName: 'Hero Section' },
  { name: 'about', displayName: 'About Section' },
  { name: 'services', displayName: 'Services' },
  { name: 'contact', displayName: 'Contact' },
  { name: 'navigation', displayName: 'Navigation' },
  { name: 'site-config', displayName: 'Site Config' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { selectedPortfolio, portfolios, selectPortfolio } = usePortfolio();
  const navigate = useNavigate();
  const [entityDefinitions, setEntityDefinitions] = useState<EntityDefinitionNav[]>([]);
  const [isLoadingNav, setIsLoadingNav] = useState(true);

  useEffect(() => {
    const fetchEntityDefinitions = async () => {
      if (!selectedPortfolio) {
        setIsLoadingNav(false);
        return;
      }

      try {
        setIsLoadingNav(true);
        const client = getClient();
        const { data } = await client.query({
          query: GET_ALL_ENTITY_DEFINITIONS,
          fetchPolicy: 'network-only', // Always fetch fresh when portfolio changes
        });

        if (data?.allEntityDefinitions) {
          setEntityDefinitions(data.allEntityDefinitions);
        }
      } catch (err) {
        console.error('Failed to fetch entity definitions for nav:', err);
        // Will fall back to hardcoded types
      } finally {
        setIsLoadingNav(false);
      }
    };

    fetchEntityDefinitions();
  }, [selectedPortfolio]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Group entity definitions by category
  const groupedDefinitions = entityDefinitions.reduce<Record<string, EntityDefinitionNav[]>>(
    (acc, def) => {
      const category = def.category || 'Content';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(def);
      return acc;
    },
    {}
  );

  // Use entity definitions if available, otherwise fall back to hardcoded types
  const hasDefinitions = entityDefinitions.length > 0;
  const contentTypes = hasDefinitions
    ? entityDefinitions
    : FALLBACK_CONTENT_TYPES.map((t) => ({ ...t, id: t.name }));

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>CMS Admin</h1>
          {portfolios.length > 1 ? (
            <select 
              className="admin-portfolio-switcher"
              value={selectedPortfolio?.id || ''}
              onChange={(e) => {
                const portfolio = portfolios.find(p => p.id === e.target.value);
                if (portfolio) {
                  selectPortfolio(portfolio);
                }
              }}
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <p>{selectedPortfolio?.name || 'Content Management'}</p>
          )}
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

          {/* Dynamic content type navigation */}
          {isLoadingNav ? (
            <div className="admin-nav-loading" style={{ paddingLeft: '2.5rem', opacity: 0.5 }}>
              Loading...
            </div>
          ) : hasDefinitions ? (
            // Render grouped navigation when we have entity definitions
            Object.entries(groupedDefinitions).map(([category, defs]) => (
              <React.Fragment key={category}>
                {Object.keys(groupedDefinitions).length > 1 && (
                  <div className="admin-nav-category" style={{ 
                    paddingLeft: '2.5rem', 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    color: 'var(--admin-text-muted)',
                    marginTop: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    {category}
                  </div>
                )}
                {defs.map((def) => (
                  <NavLink
                    key={def.id}
                    to={`/admin/content/${def.name}`}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    {def.icon && <Icon className="admin-nav-icon" fontSize="small">{def.icon}</Icon>}
                    {def.displayName || def.name}
                  </NavLink>
                ))}
              </React.Fragment>
            ))
          ) : (
            // Fallback to simple list
            contentTypes.map((type) => (
              <NavLink
                key={type.name}
                to={`/admin/content/${type.name}`}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
                style={{ paddingLeft: '2.5rem' }}
              >
                {type.displayName || type.name}
              </NavLink>
            ))
          )}

          {/* Schema Management - shown when we have entity definitions support */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
            <NavLink
              to="/admin/schema"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-nav-icon">&#9881;</span>
              Content Types
            </NavLink>
          </div>
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
