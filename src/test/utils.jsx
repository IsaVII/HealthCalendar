import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { render } from '@testing-library/react';

import authReducer from '@/features/auth/authSlice';
import healthReducer from '@/features/health/healthSlice';
import i18n from '@/i18n';

/** A store with the real reducers and an optional preloaded state. */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer, health: healthReducer },
    preloadedState,
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
}

/**
 * Render a component wired to a fresh store, an in-memory router and the app's
 * i18n instance. Returns the testing-library result plus the `store`.
 */
export function renderWithProviders(
  ui,
  { preloadedState, store = makeStore(preloadedState), route = '/', ...options } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** Build a Supabase-style chainable query mock that resolves to `result`. */
export function mockQuery(result) {
  const promise = Promise.resolve(result);
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    order: () => chain,
    maybeSingle: () => promise,
    single: () => promise,
    then: (...args) => promise.then(...args),
    catch: (...args) => promise.catch(...args),
  };
  return chain;
}
