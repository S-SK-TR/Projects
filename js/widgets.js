/**
 * widgets.js - Enhanced Widget Factory & Renderers
 */
const Widgets = {
    _counter: 0,
    _charts: {},

    nextId() { return `widget-${Date.now()}-${++this._counter}`; },

    /**
     * Creates HTML content for the widget
     */
    createContent(id, type, title, config = {}) {
        const toolbar = `<div class="widget-toolbar">
            <button class="btn btn-outline-secondary btn-widget-fullscreen" data-widget-id="${id}" title="Tam Ekran"><i class="bi bi-arrows-fullscreen"></i></button>
            <button class="btn btn-outline-secondary btn-widget-config" data-widget-id="${id}" title="Ayarlar"><i class="bi bi-gear"></i></button>
        </div>`;

        // Default color check
        const color = config.color || 'primary';
        let body = '';

        // --- Render Logic Based on Type ---
        if (type === 'chart') {
            // General Chart Canvas
            body = `<canvas id="chart-${id}"></canvas>`;
        } else if (type === 'pivot-table') {
            body = this._renderPivotPlaceholder(config);
        } else if (type === 'cycle-time' || type === 'lead-time') {
            body = this._renderMetricCard(type, color);
        } else if (type === 'assigned-to-me') {
            body = this._renderTaskList();
        } else if (type === 'work-items') {
            body = this._renderKanbanPreview();
        } else if (type === 'code-tile') {
            body = this._renderCodeTile(config);
        } else if (type === 'embedded-page') {
            const url = config.url || 'https://google.com';
            body = `<iframe src="${url}" class="w-100 h-100 border-0" ></iframe>`;
        } else {
            // Fallback
            body = `<div class="d-flex align-items-center justify-content-center text-muted h-100 italic">Widget İçeriği Yok</div>`;
        }

        // We store the full "config" object in a data attribute (JSON stringified) for easy retrieval during edit
        const configJson = encodeURIComponent(JSON.stringify(config));

        return `<div class="widget-header"><span class="widget-title">${title}</span>${toolbar}</div>
                <div class="widget-body" 
                     data-widget-type="${type}" 
                     data-widget-config="${configJson}">
                     ${body}
                </div>`;
    },

    // --- Specific Render Helpers ---

    _renderPivotPlaceholder(config) {
        const map = { 'assignee': 'Atanan', 'priority': 'Öncelik', 'state': 'Durum', 'tags': 'Etiket' };
        const r = map[config.pivotRows] || config.pivotRows || 'Satır';
        const c = map[config.pivotCols] || config.pivotCols || 'Sütun';

        return `<div class="table-responsive w-100 text-xs">
            <table class="table table-striped table-bordered mb-0" style="font-size:0.75rem;">
                <thead><tr><th>${r} / ${c}</th><th>Kritik</th><th>Normal</th><th>Düşük</th><th>Toplam</th></tr></thead>
                <tbody>
                    <tr><th>Grup A</th><td>5</td><td>12</td><td>8</td><td>25</td></tr>
                    <tr><th>Grup B</th><td>2</td><td>24</td><td>15</td><td>41</td></tr>
                    <tr><th>Grup C</th><td>0</td><td>10</td><td>30</td><td>40</td></tr>
                    <tr><th>Toplam</th><td>7</td><td>46</td><td>53</td><td>106</td></tr>
                </tbody>
            </table>
        </div>`;
    },

    _renderMetricCard(type, color) {
        const val = type === 'cycle-time' ? '4.2 Gün' : '7.5 Gün';
        const label = type === 'cycle-time' ? 'Ortalama Devir Hızı' : 'Ort. Teslim Süresi';
        return `<div class="d-flex flex-column align-items-center justify-content-center h-100">
            <h2 class="display-6 fw-bold text-${color}">${val}</h2>
            <small class="text-secondary text-uppercase">${label}</small>
            <div class="mt-2 text-success small"><i class="bi bi-arrow-down"></i> %12 İyileşme (Geçen Hafta)</div>
        </div>`;
    },

    _renderTaskList() {
        return `<ul class="list-group list-group-flush w-100 text-xs">
            <li class="list-group-item bg-transparent d-flex justify-content-between"><span><i class="bi bi-bug text-danger me-2"></i>Login hatası düzeltilecek</span><span class="badge bg-danger">P1</span></li>
            <li class="list-group-item bg-transparent d-flex justify-content-between"><span><i class="bi bi-file-code text-info me-2"></i>API dokümantasyonu</span><span class="badge bg-info">P2</span></li>
            <li class="list-group-item bg-transparent d-flex justify-content-between"><span><i class="bi bi-check2-circle text-success me-2"></i>Code Review</span><span class="badge bg-secondary">P3</span></li>
        </ul>`;
    },

    _renderKanbanPreview() {
        return `<div class="d-flex w-100 h-100 gap-2 p-2 overflow-hidden">
            <div class="flex-fill bg-secondary bg-opacity-10 rounded p-1"><small class="text-muted d-block text-center mb-1">Yeni</small><div class="bg-primary bg-opacity-25 p-1 rounded mb-1" style="height:20px;"></div><div class="bg-primary bg-opacity-25 p-1 rounded" style="height:20px;"></div></div>
            <div class="flex-fill bg-secondary bg-opacity-10 rounded p-1"><small class="text-muted d-block text-center mb-1">Aktif</small><div class="bg-warning bg-opacity-25 p-1 rounded mb-1" style="height:40px;"></div></div>
            <div class="flex-fill bg-secondary bg-opacity-10 rounded p-1"><small class="text-muted d-block text-center mb-1">Bitti</small><div class="bg-success bg-opacity-25 p-1 rounded mb-1" style="height:30px;"></div></div>
        </div>`;
    },

    _renderCodeTile(config) {
        return `<div class="d-flex flex-column w-100 h-100 justify-content-center align-items-center">
            <i class="bi bi-git text-primary mb-2" style="font-size:2rem;"></i>
            <h5 class="mb-0">Main Branch</h5>
            <small class="text-success"><i class="bi bi-check-circle-fill"></i> Build Başarılı</small>
            <div class="mt-2 text-muted small">Son commit: 2s önce</div>
        </div>`;
    },

    /**
     * Renders Chart.js based on config
     */
    renderChart(widgetId, config) {
        const canvas = document.getElementById(`chart-${widgetId}`);
        if (!canvas) return;

        if (this._charts[widgetId]) {
            this._charts[widgetId].destroy();
        }

        // Parse Config Options
        const chartType = config.chartType || 'bar'; // bar, column, line, area, pie, stacked-bar...
        const colorTheme = config.color || 'primary';

        // Define Chart.js Type
        let jsType = 'bar'; // default
        let isStacked = false;
        let isArea = false;
        let isColumn = false; // vertical bar is default 'bar' in Chart.js, horizontal needs indexAxis:'y'

        if (chartType === 'line' || chartType === 'area') { jsType = 'line'; }
        if (chartType === 'area') { isArea = true; }
        if (chartType === 'stacked-area') { jsType = 'line'; isArea = true; isStacked = true; }
        if (chartType === 'pie' || chartType === 'doughnut') { jsType = chartType; }
        if (chartType === 'stacked-bar') { jsType = 'bar'; isStacked = true; }
        if (chartType === 'column') { jsType = 'bar'; isColumn = true; } // vertical
        if (chartType === 'bar' && !isColumn) { jsType = 'bar'; }

        let indexAxis = 'x';
        if (chartType === 'bar') indexAxis = 'y'; // Horizontal Bar
        if (chartType === 'column') indexAxis = 'x'; // Vertical Bar

        // Colors
        const themeColors = {
            primary: ['rgba(99,102,241,0.7)', '#6366f1'],
            success: ['rgba(34,197,94,0.7)', '#22c55e'],
            warning: ['rgba(245,158,11,0.7)', '#f59e0b'],
            danger: ['rgba(239,68,68,0.7)', '#ef4444'],
            multi: [
                ['rgba(99,102,241,0.7)', 'rgba(34,197,94,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(6,182,212,0.7)'],
                ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']
            ]
        };
        const c = themeColors[colorTheme] || themeColors.primary;

        // Mock Data Generation
        let labels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
        let dataPoints = labels.map(() => Math.floor(Math.random() * 80 + 20));

        // Sort Data Support
        if (config.sort === 'asc' || config.sort === 'desc') {
            const combined = labels.map((l, i) => ({ l, v: dataPoints[i] }));
            if (config.sort === 'asc') combined.sort((a, b) => a.v - b.v);
            if (config.sort === 'desc') combined.sort((a, b) => b.v - a.v);
            labels = combined.map(x => x.l);
            dataPoints = combined.map(x => x.v);
        }

        let datasets = [];
        if (colorTheme === 'multi' || jsType === 'pie' || jsType === 'doughnut') {
            datasets.push({
                label: 'Veri',
                data: dataPoints,
                backgroundColor: themeColors.multi[0],
                borderColor: themeColors.multi[1],
                borderWidth: 1,
                fill: isArea
            });
        } else {
            datasets.push({
                label: 'Seri 1',
                data: dataPoints,
                backgroundColor: c[0],
                borderColor: c[1],
                borderWidth: 2,
                tension: 0.4,
                fill: isArea,
                borderRadius: (jsType === 'bar' && !isStacked) ? 4 : 0
            });
            // If stacked, add a second mock series
            if (isStacked) {
                datasets.push({
                    label: 'Seri 2',
                    data: labels.map(() => Math.floor(Math.random() * 50 + 10)),
                    backgroundColor: 'rgba(148,163,184,0.7)',
                    borderColor: '#94a3b8',
                    borderWidth: 2,
                    fill: isArea
                });
            }
        }

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: indexAxis,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10 } },
                title: { display: false }
            },
            scales: {}
        };

        if (jsType !== 'pie' && jsType !== 'doughnut') {
            options.scales = {
                x: { stacked: isStacked, grid: { color: 'rgba(128,128,128,0.2)' }, ticks: { color: '#94a3b8' } },
                y: { stacked: isStacked, grid: { color: 'rgba(128,128,128,0.2)' }, ticks: { color: '#94a3b8' } }
            };
        } else {
            options.scales = { x: { display: false }, y: { display: false } };
        }

        this._charts[widgetId] = new Chart(canvas, {
            type: jsType,
            data: { labels, datasets },
            options
        });
    },

    refreshAllCharts() {
        // Simple re-render logic for demo purposes
        Object.keys(this._charts).forEach(id => {
            const chart = this._charts[id];
            chart.data.datasets.forEach(ds => {
                ds.data = ds.data.map(() => Math.floor(Math.random() * 90 + 10));
            });
            chart.update();
        });
    },

    destroyChart(id) { if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; } },

    getDefaultSize(type, subtype) {
        if (type === 'chart') return { w: 6, h: 4 };
        if (type === 'pivot-table') return { w: 6, h: 4 };
        if (type === 'work-items') return { w: 4, h: 4 };
        if (type === 'embedded-page') return { w: 6, h: 4 };
        return { w: 3, h: 2 }; // Cards (cycle time, assigned to me, etc)
    }
};
