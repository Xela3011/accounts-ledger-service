import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'qik.authToken';

let authTokenSnapshot: string | null = null;

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export function getAuthTokenSnapshot() {
  return authTokenSnapshot;
}

export async function loadStoredAuthToken() {
  if (!(await canUseSecureStore())) {
    return authTokenSnapshot;
  }

  authTokenSnapshot = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return authTokenSnapshot;
}

export async function storeAuthToken(token: string) {
  authTokenSnapshot = token;

  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }
}

export async function clearStoredAuthToken() {
  authTokenSnapshot = null;

  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }
}
