/**
 * Centralized API Endpoints Configuration
 */
export const Endpoints = {
  Auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    oauth: '/oauth/token'
  },
  Pet: {
    base: '/pet'
  },
  Store: {
    base: '/store/order'
  },
  User: {
    base: '/user'
  },
};
