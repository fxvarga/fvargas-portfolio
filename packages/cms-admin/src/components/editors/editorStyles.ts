import { makeStyles, tokens } from '@fluentui/react-components';

export const useEditorStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  nestedFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nestedSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  nestedSectionTitle: {
    margin: '0 0 12px',
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
});
