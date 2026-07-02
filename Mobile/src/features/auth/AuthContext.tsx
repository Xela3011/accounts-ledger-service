import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react';

import {
  clearStoredAuthToken,
  loadStoredAuthToken,
  storeAuthToken,
} from './storage/authTokenStorage';

type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

export type AuthUser = {
  email: string;
  id: string;
  lastName: string | null;
  name: string | null;
};

type AuthContextValue = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
};

type LoginMutationData = {
  login: {
    accessToken: string;
    user: AuthUser;
  };
};

type LoginMutationVariables = {
  input: {
    email: string;
    password: string;
  };
};

type MeQueryData = {
  me: AuthUser;
};

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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation<
    LoginMutationData,
    LoginMutationVariables
  >(LOGIN_MUTATION);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = await loadStoredAuthToken();

      if (!isMounted) {
        return;
      }

      if (!storedToken) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const { data } = await apolloClient.query<MeQueryData>({
          fetchPolicy: 'network-only',
          query: ME_QUERY,
        });

        if (!isMounted) {
          return;
        }

        if (!data?.me) {
          throw new Error('Authenticated user was not returned.');
        }

        setToken(storedToken);
        setUser(data.me);
        setStatus('authenticated');
      } catch {
        await clearStoredAuthToken();
        await apolloClient.clearStore();

        if (!isMounted) {
          return;
        }

        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [apolloClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (email, password) => {
        const { data } = await loginMutation({
          variables: {
            input: {
              email: email.trim(),
              password,
            },
          },
        });

        if (!data?.login) {
          throw new Error('Login did not return a session.');
        }

        await storeAuthToken(data.login.accessToken);
        apolloClient.writeQuery<MeQueryData>({
          data: { me: data.login.user },
          query: ME_QUERY,
        });

        setToken(data.login.accessToken);
        setUser(data.login.user);
        setStatus('authenticated');
      },
      logout: async () => {
        await clearStoredAuthToken();
        await apolloClient.clearStore();

        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      },
      status,
      token,
      user,
    }),
    [apolloClient, loginMutation, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return value;
}
