import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  Text,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbEntry[];
  badge?: {
    label: string;
    color?: 'informative' | 'success' | 'warning' | 'danger' | 'important' | 'severe' | 'subtle' | 'brand';
  };
  actions?: React.ReactNode;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '36px',
    gap: tokens.spacingHorizontalXL,
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    minWidth: 0,
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    lineHeight: '34px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: '8px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    lineHeight: '22px',
    letterSpacing: '-0.005em',
  },
  breadcrumbs: {
    marginBottom: '8px',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: '6px',
  },
});

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
}) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.titleArea}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb size="small" className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <BreadcrumbDivider />}
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
        )}
        <h1 className={styles.title}>{title}</h1>
        {(subtitle || badge) && (
          <div className={styles.subtitleRow}>
            {subtitle && (
              <Text className={styles.subtitle}>{subtitle}</Text>
            )}
            {badge && (
              <Badge appearance="filled" color={badge.color || 'informative'}>
                {badge.label}
              </Badge>
            )}
          </div>
        )}
      </div>
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
