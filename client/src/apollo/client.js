// src/apollo/client.js

import {
  ApolloClient,
  InMemoryCache,
  split,
  createHttpLink
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

// 1) HTTP link (no auth yet)
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL
});

// 2) Auth link that runs on every HTTP request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('code-review-platform');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

// 3) WS link for subscriptions (injects auth via connectionParams)
const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_WS_URL,
    connectionParams: () => {
      const token = localStorage.getItem('code-review-platofrom');
      return {
        authorization: token ? `Bearer ${token}` : ''
      };
    }
  })
);

// 4) Split by operation type
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === 'OperationDefinition' && def.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// 5) Create the client
export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' }
  }
});
