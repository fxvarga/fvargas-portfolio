import React, { useEffect, useState } from 'react'
import aImg from '../../images/about/fernando-portfolio-image.png'
import CustomDialog from '../dialog/InsightsDialog';
import { useDevMode } from '../../main-component/State/DevModeProvider';
import { styled } from '@mui/material/styles';
import { useLazyQuery, useSubscription } from '@apollo/client';
import { messageSubscription, startTimer } from '../../api/insightsApi';

// Styled code block component
const CodeBlock = styled('pre')(({ theme }) => ({
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
const SyntaxHighlightedCode = ({ code }) => {
  // Parse the code with simple syntax highlighting
  const highlightedCode = code
  return <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
};
const About = () => {
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
  return (

    <section className="tf-about-section section-padding">
      <div className="container">
        <div className="tf-about-wrap">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12 col-12">
              <div className="tf-about-img">
                <img src={aImg} alt="" />
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
                      <CustomDialog title="How's about a timer using GraphQl Subscriptions?"
                        callback={startTimerQuery}
                        onCloseCallBack={() => { setComplete(false); setTimeOnCard(0); }}>
                        {!loading && !error && (
                          <>
                            <p>
                              In twelve years of experience, I've learned a thing or two about websockets and GraphQl
                            </p>
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
                    <h3>12+</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-12">
              <div className="tf-about-text">
                <small>Hi I'm Fernando Vargas</small>
                <h2>Full-Stack Engineer with Passion for UX</h2>
                <h5>I'm a full-stack engineer with 12+ years of experience architecting distributed systems and crafting frontends that people love to use.</h5>
                <p> I thrive at the intersection of technical depth and user experience—equally comfortable optimizing backend architecture as I am building intuitive React UIs. Whether I'm designing a visual workflow editor, building a GraphQL-powered dashboard, or creating reusable components adopted by entire organizations, I care deeply about performance, maintainability, and impact. I'm passionate about platforms, developer experience, and the power of well-crafted tools to unlock creativity at scale. </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="visible-rotate-text">
        <h1>About Me</h1>
      </div>
    </section >
  )
}

export default About;