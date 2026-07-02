import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

import { GRAPHQL_URL } from '../../config/environment';

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: GRAPHQL_URL,
  }),
});
