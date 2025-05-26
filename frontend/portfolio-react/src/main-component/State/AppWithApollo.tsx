import React from 'react';
import { useConfig } from './ConfigProvider';
import { initializeClient } from '../../api/apiProvider';
import { ApolloProvider } from '@apollo/client';
// Inner component that sets up Apollo after config loads
const AppWithApollo = ({ children }) => {
  const { config, isLoading, error } = useConfig();

  if (isLoading) {
    return <></>;
  }

  if (error) {
    return <div>Error loading configuration: {error.message}</div>;
  }

  // Initialize Apollo with the API URL from config
  const client = initializeClient(config);

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};
export default AppWithApollo;