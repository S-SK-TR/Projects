/**
 * api.js - API Client Wrapper
 * Handles all HTTP requests with JWT token injection.
 */
const API = {
    BASE_URL: '',

    /**
     * IS_DEMO flag: Automatically true if running on GitHub Pages or local file system.
     */
    IS_DEMO: window.location.hostname.includes('github.io') || window.location.protocol === 'file:',

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('portal_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    async request(method, url, body = null) {
        // --- MOCK DATA LAYER FOR GITHUB PAGES DEMO ---
        if (this.IS_DEMO) {
            console.log(`[MockAPI] ${method} ${url}`, body);
            await new Promise(r => setTimeout(r, 600)); // Simulate delay

            // Mock: Login
            if (url.includes('/auth/login')) {
                const { username } = body;
                return {
                    token: "mock_jwt_token_12345",
                    user: {
                        username: username,
                        role: username.toLowerCase().includes('admin') ? 'Admin' : 'User'
                    }
                };
            }

            // Mock: Get Dashboards
            if (method === 'GET' && url === '/api/dashboards') {
                return [
                    { id: 1, name: "Genel Bakış", isDefault: true, refreshInterval: 60, lastModified: new Date().toISOString() },
                    { id: 2, name: "Satış Raporları", isDefault: false, refreshInterval: 120, lastModified: new Date().toISOString() },
                    { id: 3, name: "IT Metrikleri", isDefault: false, refreshInterval: 30, lastModified: new Date().toISOString() }
                ];
            }

            // Mock: Get Single Dashboard
            if (method === 'GET' && url.match(/\/api\/dashboards\/\d+$/)) {
                // Extract ID from URL
                const id = parseInt(url.split('/').pop());

                const sampleLayout = JSON.stringify([
                    { x: 0, y: 0, w: 4, h: 4, widgetId: "101", widgetType: "chart", widgetConfig: { title: "Aylık Satışlar", chartType: "column", color: "primary" } },
                    { x: 4, y: 0, w: 4, h: 4, widgetId: "102", widgetType: "chart", widgetConfig: { title: "Web Trafiği", chartType: "line", color: "success" } },
                    { x: 8, y: 0, w: 4, h: 4, widgetId: "103", widgetType: "chart", widgetConfig: { title: "Müşteri Dağılımı", chartType: "pie", color: "warning" } },
                    { x: 0, y: 4, w: 6, h: 4, widgetId: "104", widgetType: "assigned-to-me", widgetConfig: { title: "Görevlerim" } },
                    { x: 6, y: 4, w: 6, h: 4, widgetId: "105", widgetType: "chart", widgetConfig: { title: "Sunucu Yükü", chartType: "area", color: "danger" } }
                ]);

                // Return a mock dashboard based on ID
                if (id === 1) return { id: 1, name: "Genel Bakış", isDefault: true, refreshInterval: 60, lastModified: new Date().toISOString(), layoutConfig: sampleLayout };
                if (id === 2) return { id: 2, name: "Satış Raporları", isDefault: false, refreshInterval: 120, lastModified: new Date().toISOString(), layoutConfig: sampleLayout };

                return { id: id, name: `Mock Dashboard ${id}`, isDefault: false, refreshInterval: 60, lastModified: new Date().toISOString(), layoutConfig: sampleLayout };
            }

            // Mock: Get Widgets for Dashboard
            if (method === 'GET' && url.includes('/widgets')) {
                // Return random sample widgets
                return [
                    { id: 101, title: "Toplam Satış", type: "chart", subtype: "column", width: 4, height: 4, config: JSON.stringify({ chartType: 'column', color: 'primary' }) },
                    { id: 102, title: "Aktif Kullanıcılar", type: "chart", subtype: "line", width: 4, height: 4, config: JSON.stringify({ chartType: 'line', color: 'success' }) },
                    { id: 103, title: "Bölgesel Dağılım", type: "chart", subtype: "pie", width: 4, height: 4, config: JSON.stringify({ chartType: 'pie', color: 'multi' }) },
                    { id: 104, title: "Önemli Görevler", type: "assigned-to-me", width: 6, height: 4, config: "{}" },
                    { id: 105, title: "Sunucu Durumu", type: "chart", subtype: "bar", width: 6, height: 4, config: JSON.stringify({ chartType: 'bar', color: 'danger' }) }
                ];
            }

            // Mock: Create/Update
            if (method === 'POST' || method === 'PUT') {
                return body || { id: Math.floor(Math.random() * 1000) };
            }

            // Mock: Delete
            if (method === 'DELETE') {
                return null;
            }

            return null;
        }
        // ---------------------------------------------

        const options = {
            method,
            headers: this.getHeaders()
        };
        if (body) options.body = JSON.stringify(body);

        let fullUrl = url.startsWith('http') ? url : `${this.BASE_URL}${url}`;
        const response = await fetch(fullUrl, options);

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
