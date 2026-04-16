/**
 * admin.js - Admin Panel Functions
 */
const Admin = {
    async loadUsers() {
        const users = await API.get('/api/users');
        if (!users) return;
        const $tbody = $('#usersTableBody');
        $tbody.empty();
        users.forEach(u => {
            const roleBadge = u.role === 'Admin'
                ? '<span class="badge bg-warning text-dark">Admin</span>'
                : '<span class="badge bg-secondary">Kullanıcı</span>';
            const date = new Date(u.createdAt).toLocaleDateString('tr-TR');
            const deleteBtn = u.username === 'admin' ? ''
                : `<button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${u.id}"><i class="bi bi-trash"></i></button>`;
            $tbody.append(`<tr><td>${u.id}</td><td>${u.username}</td><td>${roleBadge}</td><td>${date}</td><td class="text-end">${deleteBtn}</td></tr>`);
        });
    },

    async addUser(username, password, role) {
        await API.post('/api/auth/register', { username, password, role });
        await this.loadUsers();
    },

    async deleteUser(id) {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        await API.delete(`/api/users/${id}`);
        await this.loadUsers();
    },

    async loadDashboards() {
        const dashes = await API.get('/api/dashboards');
        if (!dashes) return;
        const $tbody = $('#dashboardsTableBody');
        $tbody.empty();
        dashes.forEach(d => {
            const def = d.isDefault ? '<i class="bi bi-check-circle-fill text-success"></i>' : '';
            const date = new Date(d.updatedAt).toLocaleDateString('tr-TR');
            const ref = d.refreshIntervalSeconds > 0 ? `${d.refreshIntervalSeconds}sn` : 'Kapalı';
            $tbody.append(`<tr>
                <td>${d.id}</td><td>${d.name}</td><td>${ref}</td><td>${def}</td><td>${date}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger btn-delete-dashboard" data-id="${d.id}"><i class="bi bi-trash"></i></button>
                </td></tr>`);
        });
    },

    async createDashboard(name, refreshInterval, isDefault) {
        await API.post('/api/dashboards', { name, refreshIntervalSeconds: refreshInterval, isDefault });
        await this.loadDashboards();
        await DashboardManager.loadDashboardList();
    },

    async deleteDashboard(id) {
        if (!confirm('Bu dashboard silinecek. Emin misiniz?')) return;
        await API.delete(`/api/dashboards/${id}`);
        await this.loadDashboards();
        await DashboardManager.loadDashboardList();
        if (DashboardManager.currentDashboard?.id === id) {
            DashboardManager.currentDashboard = null;
            DashboardManager.showEmpty();
        }
    }
};
