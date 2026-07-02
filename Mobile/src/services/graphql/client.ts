import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

import { GRAPHQL_URL } from '../../config/environment';
import { getAuthTokenSnapshot } from '../../features/auth/storage/authTokenStorage';

const authLink = new ApolloLink((operation, forward) => {
  const token = getAuthTokenSnapshot();

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }));

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
});
