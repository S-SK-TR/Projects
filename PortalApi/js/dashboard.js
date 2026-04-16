/**
 * dashboard.js - Dashboard Manager
 * Handles GridStack init, layout load/save, auto-refresh.
 */
const DashboardManager = {
    grid: null,
    currentDashboard: null,
    refreshTimer: null,
    refreshCountdown: 0,
    isEditMode: false,

    init() {
        this.grid = GridStack.init({
            column: 12,
            cellHeight: 80,
            animate: true,
            float: true,
            staticGrid: true,
            margin: 6,
            disableResize: true,
            disableDrag: true
        }, '#gridStack');
    },

    async loadDashboardList() {
        const dashboards = await API.get('/api/dashboards');
        if (!dashboards) return;
        const $sel = $('#dashboardSelect');
        $sel.find('option:not(:first)').remove();
        dashboards.forEach(d => {
            $sel.append(`<option value="${d.id}" ${d.isDefault ? 'data-default="true"' : ''}>${d.name}</option>`);
        });
        return dashboards;
    },

    async selectDashboard(id) {
        if (!id) { this.showEmpty(); return; }
        try {
            const d = await API.get(`/api/dashboards/${id}`);
            if (!d) return;
            this.currentDashboard = d;
            this.clearGrid();
            const items = JSON.parse(d.layoutConfig || '[]');
            if (items.length === 0) { this.showEmpty(); return; }
            $('#emptyState').addClass('d-none');
            items.forEach(item => this.addWidgetToGrid(item));
            this.updateLastRefreshTime();
            this.startAutoRefresh(d.refreshIntervalSeconds);
            Auth.setLastViewedDashboard(d.id);
            $('#dashboardSelect').val(d.id);
        } catch (e) { console.error('Dashboard load error', e); }
    },

    addWidgetToGrid(item) {
        const wId = item.widgetId || Widgets.nextId();
        const type = item.widgetType || 'chart';

        // Recover config logic
        let config = item.widgetConfig;
        if (!config) {
            // Fallback for legacy items or fresh parsing
            config = {
                title: item.title || 'Widget',
                color: item.color || 'primary',
                chartType: 'bar' // default fallback
            };
        }

        const content = Widgets.createContent(wId, type, config.title, config);
        this.grid.addWidget({
            x: item.x, y: item.y, w: item.w, h: item.h,
            id: wId,
            content: content
        });

        if (type === 'chart') {
            setTimeout(() => Widgets.renderChart(wId, config), 100);
        }
    },

    clearGrid() {
        if (!this.grid) return;
        Object.keys(Widgets._charts).forEach(id => Widgets.destroyChart(id));
        this.grid.removeAll();
    },

    showEmpty() {
        this.clearGrid();
        $('#emptyState').removeClass('d-none');
    },

    getLayoutConfig() {
        if (!this.grid) return '[]';
        const items = [];
        this.grid.engine.nodes.forEach(node => {
            const el = node.el;
            const body = el.querySelector('.widget-body');

            // Read config from DOM
            const configStr = decodeURIComponent(body?.dataset?.widgetConfig || '{}');
            const config = JSON.parse(configStr);

            items.push({
                x: node.x, y: node.y, w: node.w, h: node.h,
                widgetId: node.id || '',
                widgetType: body?.dataset?.widgetType || 'chart',
                widgetConfig: config // Persist full config object
            });
        });
        return JSON.stringify(items);
    },

    enableEdit() {
        if (!this.grid) return;
        this.isEditMode = true;
        this.grid.setStatic(false);
        this.grid.enableMove(true);
        this.grid.enableResize(true);
        $('#gridStack').addClass('editing');
        $('#btnEdit').addClass('d-none');
        $('#btnSave, #btnCancelEdit').removeClass('d-none');
    },

    disableEdit() {
        if (!this.grid) return;
        this.isEditMode = false;
        this.grid.setStatic(true);
        this.grid.enableMove(false);
        this.grid.enableResize(false);
        $('#gridStack').removeClass('editing');
        $('#btnEdit').removeClass('d-none');
        $('#btnSave, #btnCancelEdit').addClass('d-none');
    },

    async saveLayout() {
        if (!this.currentDashboard) return;
        const config = this.getLayoutConfig();
        await API.put(`/api/dashboards/${this.currentDashboard.id}`, { layoutConfig: config });
        this.currentDashboard.layoutConfig = config;
        this.disableEdit();
        this.updateLastRefreshTime();
    },

    updateLastRefreshTime() {
        const now = new Date();
        const t = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        $('#lastUpdateTime').text(t);
    },

    startAutoRefresh(seconds) {
        this.stopAutoRefresh();
        if (!seconds || seconds <= 0) {
            $('#refreshProgressContainer').addClass('d-none');
            return;
        }
        $('#refreshProgressContainer').removeClass('d-none');
        this.refreshCountdown = seconds;
        let elapsed = 0;
        this.refreshTimer = setInterval(() => {
            elapsed++;
            const pct = (elapsed / seconds) * 100;
            $('#refreshProgressBar').css('width', pct + '%');
            if (elapsed >= seconds) {
                elapsed = 0;
                $('#refreshProgressBar').css('width', '0%');
                this.refreshData();
            }
        }, 1000);
    },

    stopAutoRefresh() {
        if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
        $('#refreshProgressBar').css('width', '0%');
    },

    refreshData() {
        Widgets.refreshAllCharts();
        this.updateLastRefreshTime();
    },

    addNewWidget(type, config = {}) {
        if (!this.currentDashboard) return;
        const id = Widgets.nextId();

        // Defaults
        config.title = config.title || 'Yeni Widget';
        config.color = config.color || 'primary';

        const size = Widgets.getDefaultSize(type);
        const content = Widgets.createContent(id, type, config.title, config);

        $('#emptyState').addClass('d-none');

        // GridStack Add
        this.grid.addWidget({ w: size.w, h: size.h, id: id, content: content });

        // Init Chart if needed
        if (type === 'chart') {
            setTimeout(() => Widgets.renderChart(id, config), 150);
        }

        if (!this.isEditMode) this.enableEdit();
    }
};
