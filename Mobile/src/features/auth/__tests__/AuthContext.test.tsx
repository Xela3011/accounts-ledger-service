import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '../AuthContext';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        name
        lastName
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      lastName
    }
  }
`;

const user = {
  __typename: 'User',
  email: 'alex@example.com',
  id: 'user-1',
  lastName: 'Batista',
  name: 'Alexander',
};

function Providers({
  children,
  mocks = [],
}: PropsWithChildren<{
  mocks?: ComponentProps<typeof MockedProvider>['mocks'];
}>) {
  return (
    <MockedProvider mocks={mocks} showWarnings={false}>
      <AuthProvider>{children}</AuthProvider>
    </MockedProvider>
  );
}

function AuthProbe() {
  const { login, logout, status, token, user: authUser } = useAuth();

  return (
    <View>
      <Text>{`status:${status}`}</Text>
      <Text>{`token:${token ?? 'none'}`}</Text>
      <Text>{`user:${authUser?.email ?? 'none'}`}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void login(' alex@example.com ', 'Password123!')}
      >
        <Text>Login</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => void logout()}>
        <Text>Logout</Text>
      </Pressable>
    </View>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when used outside AuthProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<AuthProbe />)).toThrow(
      'useAuth must be used within AuthProvider.',
    );

    consoleError.mockRestore();
  });

  it('restores a stored session with the authenticated user query', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('stored-token');

    render(
      <Providers
        mocks={[
          {
            request: {
              query: ME_QUERY,
            },
            result: {
              data: {
                me: user,
              },
            },
          },
        ]}
      >
        <AuthProbe />
      </Providers>,
    );

    expect(await screen.findByText('status:authenticated')).toBeTruthy();
    expect(screen.getByText('token:stored-token')).toBeTruthy();
    expect(screen.getByText('user:alex@example.com')).toBeTruthy();
  });

  it('logs in, stores the JWT, and logs out', async () => {
    render(
      <Providers
        mocks={[
          {
            request: {
              query: LOGIN_MUTATION,
              variables: {
                input: {
                  email: 'alex@example.com',
                  password: 'Password123!',
                },
              },
            },
            result: {
              data: {
                login: {
                  __typename: 'AuthPayload',
                  accessToken: 'access-token',
                  user,
                },
              },
            },
          },
        ]}
      >
        <AuthProbe />
      </Providers>,
    );

    expect(await screen.findByText('status:unauthenticated')).toBeTruthy();

    fireEvent.press(screen.getByText('Login'));

    expect(await screen.findByText('status:authenticated')).toBeTruthy();
    expect(screen.getByText('token:access-token')).toBeTruthy();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'qik.authToken',
      'access-token',
    );

    fireEvent.press(screen.getByText('Logout'));

    await waitFor(() =>
      expect(screen.getByText('status:unauthenticated')).toBeTruthy(),
    );
    expect(screen.getByText('token:none')).toBeTruthy();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('qik.authToken');
  });
});
