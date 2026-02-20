/**
 * auth.js - Authentication Manager
 * Handles login, logout, token storage, and role checks.
 */
const Auth = {
    _user: null,

    init() {
        const token = localStorage.getItem('portal_token');
        const userData = localStorage.getItem('portal_user');
        if (token && userData) {
            this._user = JSON.parse(userData);
            return true;
        }
        return false;
    },

    async login(username, password) {
        const data = await API.post('/api/auth/login', { username, password });
        if (data && data.token) {
            localStorage.setItem('portal_token', data.token);
            localStorage.setItem('portal_user', JSON.stringify({
                userId: data.userId,
                username: data.username,
                role: data.role,
                lastViewedDashboardId: data.lastViewedDashboardId
            }));
            this._user = {
                userId: data.userId,
                username: data.username,
                role: data.role,
                lastViewedDashboardId: data.lastViewedDashboardId
            };
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem('portal_token');
        localStorage.removeItem('portal_user');
        this._user = null;
        window.location.reload();
    },

    isLoggedIn() {
        return !!this._user;
    },

    isAdmin() {
        return this._user?.role === 'Admin';
    },

    getUser() {
        return this._user;
    },

    getLastViewedDashboardId() {
        return this._user?.lastViewedDashboardId;
    },

    async setLastViewedDashboard(dashboardId) {
        if (this._user) {
            this._user.lastViewedDashboardId = dashboardId;
            localStorage.setItem('portal_user', JSON.stringify(this._user));
            try {
                await API.put('/api/users/preferences', { lastViewedDashboardId: dashboardId });
            } catch (e) { /* silent fail */ }
        }
    }
};
