import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { makeStyles, Spinner, tokens } from '@fluentui/react-components';
import { useAuth } from './AuthContext';

const useStyles = makeStyles({
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const styles = useStyles();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
