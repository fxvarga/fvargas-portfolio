import { gql } from '@apollo/client';

export const startTimer = gql`
 query sessionQuery {
  startTimer{
    sessionId
  }
}
`;
export const remixImage = gql`
 query RemixImage($prompt: String!) {
  generateHeroImage(prompt: $prompt)
}
`;

export const messageSubscription = gql`
  subscription onMessageReceived {
    onMessageReceived{
      sessionId
      startTime
      durationSeconds
      elapsedMilliseconds
      isCompleted
    }
  }
`;
