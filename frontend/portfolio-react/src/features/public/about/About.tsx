import React, { useEffect, useState } from 'react'
import CustomDialog from '../../../shared/components/InsightsDialog';
import { useDevMode } from '../../../app/providers/DevModeProvider';
import { styled } from '@mui/material/styles';
import { useLazyQuery, useSubscription } from '@apollo/client';
import { messageSubscription, startTimer } from '../../../api/insightsApi';
import { CircularProgress } from '@mui/material';
import { useAbout } from '../../../shared/hooks/useCMS';

// Styled code block component
const CodeBlock = styled('pre')(() => ({
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
  borderRadius: '6px',
  padding: '16px',
  overflowX: 'auto',
  fontSize: '0.85rem',
  fontFamily: '"Fira Code", "Roboto Mono", "Consolas", monospace',
  lineHeight: 1.5,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  margin: '16px 0',
  position: 'relative',
  '& .token-comment': {
    color: '#6a9955',
  },
  '& .token-string': {
    color: '#ce9178',
  },
  '& .token-keyword': {
    color: '#569cd6',
  },
  '& .token-function': {
    color: '#dcdcaa',
  },
  '& .token-variable': {
    color: '#9cdcfe',
  },
  '& .token-operator': {
    color: '#d4d4d4',
  },
  '& .token-punctuation': {
    color: '#d4d4d4',
  },
}));

// Component to render syntax highlighted code
const SyntaxHighlightedCode = ({ code }: { code: string }) => {
  const highlightedCode = code
  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
};

const About = () => {
  const { about, isLoading: cmsLoading } = useAbout();
  const [startTimerQuery, { data, error, loading }] = useLazyQuery(startTimer, { fetchPolicy: 'network-only' });

  const [timeOnCard, setTimeOnCard] = useState(0);
  const [complete, setComplete] = useState(false);
  const {
    data: subscriptionData,
    error: subscriptionError,
    loading: subscriptionLoading,
  } = useSubscription(messageSubscription, {
    skip: !data?.startTimer?.sessionId,
  });

  useEffect(() => {
    if (subscriptionLoading || subscriptionError || !subscriptionData) {
      return;
    }
    const { onMessageReceived } = subscriptionData;
    console.log(onMessageReceived.sessionId, data?.startTimer?.sessionId);
    if (onMessageReceived.sessionId !== data?.startTimer?.sessionId) return;
    setTimeOnCard(onMessageReceived.elapsedMilliseconds);
    if (onMessageReceived.isCompleted) {
      setComplete(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionData, subscriptionLoading, subscriptionError]);

  const { devMode } = useDevMode();

  const subscriptionCode = `
const TIMER_SUBSCRIPTION = gql\`
  subscription receiveMessage {
    onMessageReceived{
      sessionId
      startTime
      durationSeconds
      ellapsedMilliseconds
    }
  }
\`
const sessionId = ${data?.startTimer?.sessionId};
`;

  if (cmsLoading || !about) {
    return (
      <section className="tf-about-section section-padding">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <CircularProgress />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tf-about-section section-padding">
      <div className="container">
        <div className="tf-about-wrap">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12 col-12">
              <div className="tf-about-img">
                <img src={about.image.url} alt={about.image.alt} />
                <div className="tf-about-img-text">
                  {devMode && (
                    <div className="assistant-button" style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <CustomDialog title={about.insightsDialog.title}
                        callback={startTimerQuery}
                        onCloseCallBack={() => { setComplete(false); setTimeOnCard(0); }}>
                        {!loading && !error && (
                          <>
                            <p>{about.insightsDialog.description}</p>
                            <CodeBlock>
                              <SyntaxHighlightedCode code={subscriptionCode} />
                            </CodeBlock>
                            <p>
                              This subscription establishes a persistent connection to the server,
                              allowing it to push updates about the timer in real-time. The component
                              then formats and displays the elapsed time since you first arrived on this modal.
                            </p>
                            <h3> You've been here {timeOnCard} milliseconds</h3>
                            {complete && (
                              <h4>I think you get the point...</h4>
                            )}
                          </>
                        )}
                      </CustomDialog>
                    </div>
                  )}
                  <div className="tf-about-icon">
                    <h3>{about.experienceYears}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-12">
              <div className="tf-about-text">
                <small>{about.greeting}</small>
                <h2>{about.headline}</h2>
                <h5>{about.subheadline}</h5>
                <p>{about.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="visible-rotate-text">
        <h1>{about.sectionTitle}</h1>
      </div>
    </section>
  )
}

export default About;
