// Project Overview: Dynamic Portfolio Site for Fernando
// Stack: React + Apollo Client + Context + GraphQL CMS (HotChocolate)

// File: src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import client from './library/apollo';
import { CMSProvider } from './context/CMSContext';
// import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <ApolloProvider client={client}>
    <CMSProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CMSProvider>
  </ApolloProvider>
);

