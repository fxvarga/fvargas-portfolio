import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { gql } from '@apollo/client';
import { getClient } from '../../../api/apiProvider';
import { useAuth } from '../auth/AuthContext';
import { usePortfolio } from '../auth/PortfolioContext';
import {
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  Button,
  Dropdown,
  FluentProvider,
  Option,
  Spinner,
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from '@fluentui/react-components';
import { sidebarDarkTheme } from '../theme';
import {
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavDrawerFooter,
  NavItem,
  NavSectionHeader,
  NavDivider,
} from '@fluentui/react-nav';
import {
  BoardRegular,
  EditRegular,
  SettingsRegular,
  SignOutRegular,
  ChevronDownRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';

interface EntityDefinitionNav {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  icon?: string;
  isSingleton: boolean;
}

interface ContentRecordNav {
  id: string;
  entityType: string;
  data: Record<string, unknown> | string;
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
      isSingleton
    }
  }
`;

const GET_ALL_CONTENT_ADMIN = gql`
  mutation GetAllContentAdmin($entityType: String) {
    getAllContentAdmin(entityType: $entityType) {
      id
      entityType
      data
    }
  }
`;

const FALLBACK_CONTENT_TYPES = [
  { name: 'hero', displayName: 'Hero Section' },
  { name: 'about', displayName: 'About Section' },
  { name: 'services', displayName: 'Services' },
  { name: 'contact', displayName: 'Contact' },
  { name: 'navigation', displayName: 'Navigation' },
  { name: 'site-config', displayName: 'Site Config' },
];

const useStyles = makeStyles({
  // ── Root layout ──
  layout: {
    display: 'flex',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colorNeutralBackground2,
  },

  // ── Sidebar / drawer ──
  drawer: {
    width: '264px',
    flexShrink: 0,
    backgroundColor: '#1b2332',
    borderRight: 'none',
    // Subtle inner shadow for depth
    boxShadow: '1px 0 0 rgba(255, 255, 255, 0.04) inset',
  },

  // ── Main content wrapper ──
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '52px',
    flexShrink: 0,
    paddingLeft: '40px',
    paddingRight: '40px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  topBarPortfolioName: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    letterSpacing: '0.02em',
  },

  // ── Main content area — generous padding ──
  main: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    paddingTop: '36px',
    paddingBottom: '56px',
    paddingLeft: '44px',
    paddingRight: '44px',
    backgroundColor: tokens.colorNeutralBackground2,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${tokens.colorNeutralStroke2} transparent`,
  },

  // ── Sidebar header ──
  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '6px',
    paddingBottom: '12px',
    paddingLeft: '4px',
    paddingRight: '4px',
  },
  sidebarBrand: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16px',
    letterSpacing: '-0.02em',
  },
  sidebarSubtitle: {
    color: 'rgba(255, 255, 255, 0.40)',
    fontSize: '12px',
    letterSpacing: '0.01em',
  },

  // ── Sidebar footer ──
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '-0.005em',
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.36)',
    fontSize: '11px',
    letterSpacing: '0.01em',
  },
  signOutBtn: {
    color: 'rgba(255, 255, 255, 0.45)',
    ':hover': {
      color: 'rgba(255, 255, 255, 0.8)',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
  },

  // ── Section group — wraps items under a section header ──
  sectionGroup: {
    paddingLeft: '8px',
  },

  // ── Singleton nav items ──
  sectionItem: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.58)',
    padding: '7px 12px',
    paddingLeft: '20px',
    fontSize: '13px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    letterSpacing: '-0.005em',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
  sectionItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    color: '#ffffff',
    fontWeight: tokens.fontWeightSemibold,
  },

  // ── Expandable parent items ──
  expandableItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    paddingLeft: '20px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
  },
  expandableItemExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  expandableLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: '13px',
    letterSpacing: '-0.005em',
  },
  expandableMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: '11px',
  },

  // ── Sub-item tree ──
  subItemList: {
    marginLeft: '28px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    paddingLeft: '0px',
    paddingTop: '2px',
    paddingBottom: '2px',
  },
  subItemLink: {
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.40)',
    display: 'block',
    padding: '3px 8px',
    paddingLeft: '12px',
    fontSize: '12px',
    borderRadius: '4px',
    marginRight: '8px',
    lineHeight: '20px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: 'rgba(255, 255, 255, 0.8)',
    },
  },
  subItemLinkActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    color: '#ffffff',
    fontWeight: tokens.fontWeightSemibold,
  },

  // ── Misc sidebar ──
  navLoading: {
    padding: '8px 24px',
  },
  sectionHeader: {
    color: 'rgba(255, 255, 255, 0.30)',
    textTransform: 'uppercase' as const,
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.10em',
    paddingTop: '24px',
    paddingBottom: '6px',
  },
  settingsSection: {
    paddingTop: tokens.spacingVerticalXS,
  },

  // ── Dark sidebar overrides for Fluent NavDrawer internals ──
  navItemDark: {
    color: 'rgba(255, 255, 255, 0.7)',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      color: '#ffffff',
    },
  },
});

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const styles = useStyles();
  const { user, logout } = useAuth();
  const { selectedPortfolio, portfolios, selectPortfolio } = usePortfolio();
  const navigate = useNavigate();
  const location = useLocation();
  const [entityDefinitions, setEntityDefinitions] = useState<EntityDefinitionNav[]>([]);
  const [nonSingletonRecords, setNonSingletonRecords] = useState<Record<string, ContentRecordNav[]>>({});
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
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
          fetchPolicy: 'network-only',
        });

        if (data?.allEntityDefinitions) {
          const definitions: EntityDefinitionNav[] = data.allEntityDefinitions;
          setEntityDefinitions(definitions);

          const nonSingletons = definitions.filter(d => !d.isSingleton);
          const recordsMap: Record<string, ContentRecordNav[]> = {};

          await Promise.all(
            nonSingletons.map(async (def) => {
              try {
                const { data: contentData } = await client.mutate({
                  mutation: GET_ALL_CONTENT_ADMIN,
                  variables: { entityType: def.name },
                });
                if (contentData?.getAllContentAdmin) {
                  recordsMap[def.name] = contentData.getAllContentAdmin;
                }
              } catch (err) {
                console.error(`Failed to fetch records for ${def.name}:`, err);
              }
            })
          );

          setNonSingletonRecords(recordsMap);
        }
      } catch (err) {
        console.error('Failed to fetch entity definitions for nav:', err);
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

  const toggleEntityExpanded = (entityName: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityName)) {
        next.delete(entityName);
      } else {
        next.add(entityName);
      }
      return next;
    });
  };

  const parseRecordData = (data: unknown): Record<string, unknown> => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data as Record<string, unknown>;
  };

  const getRecordTitle = (record: ContentRecordNav): string => {
    const data = parseRecordData(record.data);
    if (data.title && typeof data.title === 'string') return data.title;
    if (data.slug && typeof data.slug === 'string') return data.slug;
    if (data.name && typeof data.name === 'string') return data.name;
    if (data.headerTitle && typeof data.headerTitle === 'string') return data.headerTitle;
    if (data.storeName && typeof data.storeName === 'string') return data.storeName;
    return record.id.substring(0, 8) + '...';
  };

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

  const hasDefinitions = entityDefinitions.length > 0;
  const contentTypes = hasDefinitions
    ? entityDefinitions
    : FALLBACK_CONTENT_TYPES.map((t) => ({ ...t, id: t.name }));

  // Determine which NavItem is selected based on current route
  const getSelectedValue = (): string => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') return 'dashboard';
    if (location.pathname === '/admin/content') return 'content';
    if (location.pathname.startsWith('/admin/schema')) return 'schema';
    // Check entity content routes
    for (const def of entityDefinitions) {
      if (location.pathname.startsWith(`/admin/content/${def.name}`)) return `content-${def.name}`;
    }
    return 'dashboard';
  };

  // Build breadcrumbs from current route
  const getBreadcrumbs = (): { label: string; href?: string }[] => {
    const path = location.pathname;

    if (path === '/admin' || path === '/admin/') {
      return [{ label: 'Dashboard' }];
    }

    if (path === '/admin/content') {
      return [{ label: 'Content' }];
    }

    if (path === '/admin/schema' || path === '/admin/schema/') {
      return [{ label: 'Content Types' }];
    }

    if (path === '/admin/schema/new') {
      return [
        { label: 'Content Types', href: '/admin/schema' },
        { label: 'New' },
      ];
    }

    if (path.startsWith('/admin/schema/')) {
      return [
        { label: 'Content Types', href: '/admin/schema' },
        { label: 'Edit' },
      ];
    }

    if (path.startsWith('/admin/content/')) {
      const parts = path.split('/').filter(Boolean); // ['admin', 'content', entityType, recordId?]
      const entityType = parts[2];
      const recordId = parts[3];
      const def = entityDefinitions.find(d => d.name === entityType);
      const entityLabel = def?.displayName || entityType;

      if (recordId) {
        return [
          { label: 'Content', href: '/admin/content' },
          { label: entityLabel, href: `/admin/content/${entityType}` },
          { label: 'Edit' },
        ];
      }

      return [
        { label: 'Content', href: '/admin/content' },
        { label: entityLabel },
      ];
    }

    return [];
  };

  return (
    <div className={styles.layout}>
      <FluentProvider theme={sidebarDarkTheme} className={styles.drawer}>
        <NavDrawer
          open
          type="inline"
          selectedValue={getSelectedValue()}
          style={{ width: '100%', backgroundColor: 'transparent', border: 'none' }}
        >
          <NavDrawerHeader>
            <div className={styles.headerTitle}>
              <Text className={styles.sidebarBrand}>CMS Admin</Text>
              {portfolios.length > 1 ? (
                <Dropdown
                  value={selectedPortfolio?.name ?? ''}
                  selectedOptions={selectedPortfolio ? [selectedPortfolio.id] : []}
                  onOptionSelect={(_e, data) => {
                    const portfolio = portfolios.find(p => p.id === data.optionValue);
                    if (portfolio) {
                      selectPortfolio(portfolio);
                    }
                  }}
                  size="small"
                >
                  {portfolios.map(p => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Dropdown>
              ) : (
                <Text className={styles.sidebarSubtitle}>{selectedPortfolio?.name || 'Content Management'}</Text>
              )}
            </div>
          </NavDrawerHeader>

          <NavDrawerBody>
            <NavItem
              icon={<BoardRegular />}
              value="dashboard"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </NavItem>

            <NavItem
              icon={<EditRegular />}
              value="content"
              onClick={() => navigate('/admin/content')}
            >
              Content
            </NavItem>

            {/* Dynamic content type navigation */}
            {isLoadingNav ? (
              <div className={styles.navLoading}>
                <Spinner size="tiny" label="Loading..." />
              </div>
            ) : hasDefinitions ? (
              Object.entries(groupedDefinitions).map(([category, defs]) => (
                <React.Fragment key={category}>
                  <NavSectionHeader className={styles.sectionHeader}>{category}</NavSectionHeader>
                  <div className={styles.sectionGroup}>
                    {defs.map((def) => {
                      const isNonSingleton = !def.isSingleton;
                      const records = nonSingletonRecords[def.name] || [];
                      const isExpanded = expandedEntities.has(def.name);
                      const hasRecords = records.length > 0;

                      if (isNonSingleton && hasRecords) {
                        return (
                          <React.Fragment key={def.id}>
                            <div
                              className={mergeClasses(
                                styles.expandableItem,
                                isExpanded && styles.expandableItemExpanded
                              )}
                              onClick={() => toggleEntityExpanded(def.name)}
                            >
                              <div className={styles.expandableLabel}>
                                <Text size={300}>
                                  {def.displayName || def.name}
                                </Text>
                              </div>
                              <span className={styles.expandableMeta}>
                                {isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                                <Text size={200}>({records.length})</Text>
                              </span>
                            </div>
                            {isExpanded && (
                              <div className={styles.subItemList}>
                                {records.map((record) => (
                                  <NavLink
                                    key={record.id}
                                    to={`/admin/content/${def.name}/${record.id}`}
                                    className={({ isActive }) =>
                                      mergeClasses(styles.subItemLink, isActive && styles.subItemLinkActive)
                                    }
                                    title={getRecordTitle(record)}
                                  >
                                    {getRecordTitle(record)}
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      }

                      // Singleton items — use custom styled link instead of NavItem
                      const isActive = location.pathname === `/admin/content/${def.name}`;
                      return (
                        <div
                          key={def.id}
                          className={mergeClasses(
                            styles.sectionItem,
                            isActive && styles.sectionItemActive
                          )}
                          onClick={() => navigate(`/admin/content/${def.name}`)}
                        >
                          {def.displayName || def.name}
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))
            ) : (
              contentTypes.map((type) => (
                <NavItem
                  key={type.name}
                  value={`content-${type.name}`}
                  onClick={() => navigate(`/admin/content/${type.name}`)}
                >
                  {type.displayName || type.name}
                </NavItem>
              ))
            )}

            <NavDivider />

            <NavItem
              icon={<SettingsRegular />}
              value="schema"
              onClick={() => navigate('/admin/schema')}
            >
              Content Types
            </NavItem>
          </NavDrawerBody>

          <NavDrawerFooter>
            <div className={styles.footerContent}>
              <div className={styles.userInfo}>
                <Avatar
                  name={user?.username || 'Unknown'}
                  size={32}
                  color="brand"
                />
                <div className={styles.userDetails}>
                  <Text className={styles.userName}>{user?.username || 'Unknown'}</Text>
                  <Text className={styles.userRole}>{user?.role || 'User'}</Text>
                </div>
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={<SignOutRegular />}
                className={styles.signOutBtn}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </NavDrawerFooter>
        </NavDrawer>
      </FluentProvider>

      <div className={styles.mainWrapper}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <Breadcrumb size="small">
              <BreadcrumbItem>
                <BreadcrumbButton href="/admin">Admin</BreadcrumbButton>
              </BreadcrumbItem>
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <BreadcrumbDivider />
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbButton href={crumb.href}>{crumb.label}</BreadcrumbButton>
                    ) : (
                      <BreadcrumbButton current>{crumb.label}</BreadcrumbButton>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </Breadcrumb>
          </div>
          <div className={styles.topBarRight}>
            <Text className={styles.topBarPortfolioName}>{selectedPortfolio?.name}</Text>
            <Avatar
              name={user?.username || 'Unknown'}
              size={24}
              color="brand"
            />
          </div>
        </div>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
