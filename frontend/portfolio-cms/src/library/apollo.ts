import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:7007/graphql',
  cache: new InMemoryCache()
});

export default client;
