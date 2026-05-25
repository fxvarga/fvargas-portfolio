import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import {
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { LockClosedRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    // Subtle gradient background
    background: `linear-gradient(135deg, ${tokens.colorNeutralBackground2} 0%, #eef1f6 50%, #e4e9f2 100%)`,
  },
  card: {
    width: '400px',
    maxWidth: '90vw',
    paddingTop: '44px',
    paddingBottom: '36px',
    paddingLeft: '40px',
    paddingRight: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(16, 24, 40, 0.08), 0 2px 8px rgba(16, 24, 40, 0.04)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  brandMark: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#1b2332',
    marginBottom: '20px',
  },
  brandLetter: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    lineHeight: '1.2',
    color: tokens.colorNeutralForeground1,
    marginBottom: '6px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    letterSpacing: '-0.005em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  submitButton: {
    marginTop: '4px',
    height: '40px',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  footerLink: {
    color: tokens.colorNeutralForeground3,
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.15s ease',
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
  },
});

const LoginPage: React.FC = () => {
  const styles = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandMark}>
            <span className={styles.brandLetter}>A</span>
          </div>
          <Text as="h1" className={styles.title} block>
            CMS Admin
          </Text>
          <Text className={styles.subtitle}>Sign in to manage your content</Text>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}

          <Field label="Username" required>
            <Input
              value={username}
              onChange={(_e, data) => setUsername(data.value)}
              placeholder="Enter username"
              disabled={isSubmitting}
              autoComplete="username"
              size="large"
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(_e, data) => setPassword(data.value)}
              placeholder="Enter password"
              disabled={isSubmitting}
              autoComplete="current-password"
              size="large"
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={isSubmitting}
            icon={<LockClosedRegular />}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className={styles.footer}>
          <a href="/" className={styles.footerLink}>Back to Portfolio</a>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
