export const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
export const setToken = (token: string) => localStorage.setItem('access_token', token)
export const clearToken = () => localStorage.removeItem('access_token')
export const isLoggedIn = () => !!getToken()
