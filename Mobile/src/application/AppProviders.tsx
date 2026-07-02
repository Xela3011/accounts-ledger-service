import { PropsWithChildren } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { apolloClient } from '../services/graphql/client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
