/**
 * api.js - API Client Wrapper
 * Handles all HTTP requests with JWT token injection.
 */
const API = {
    BASE_URL: '',

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('portal_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    async request(method, url, body = null) {
        const options = {
            method,
            headers: this.getHeaders()
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${this.BASE_URL}${url}`, options);

        if (response.status === 401) {
            Auth.logout();
            return null;
        }

        if (response.status === 204) return null;

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.message || `HTTP ${response.status}`);
        }

        return data;
    },

    get(url) { return this.request('GET', url); },
    post(url, body) { return this.request('POST', url, body); },
    put(url, body) { return this.request('PUT', url, body); },
    delete(url) { return this.request('DELETE', url); }
};
