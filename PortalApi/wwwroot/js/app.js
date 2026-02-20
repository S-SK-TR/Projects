/**
 * app.js - Application Bootstrap
 * Wires up all modules and event handlers.
 */
$(document).ready(function () {
    // === Initialization ===
    if (Auth.init()) {
        showApp();
    } else {
        showLogin();
    }

    // === Login Form ===
    $('#loginForm').on('submit', async function (e) {
        e.preventDefault();
        const $err = $('#loginError'), $spin = $('#loginSpinner'), $txt = $('#loginBtnText');
        $err.addClass('d-none');
        $spin.removeClass('d-none'); $txt.text('Giriş yapılıyor...');
        try {
            const ok = await Auth.login($('#loginUsername').val(), $('#loginPassword').val());
            if (ok) { showApp(); }
            else { $err.text('Geçersiz kullanıcı adı veya şifre.').removeClass('d-none'); }
        } catch (ex) {
            $err.text(ex.message || 'Bağlantı hatası.').removeClass('d-none');
        }
        $spin.addClass('d-none'); $txt.text('Giriş Yap');
    });

    // === Logout ===
    $('#btnLogout').on('click', function (e) { e.preventDefault(); Auth.logout(); });

    // === Dashboard Select ===
    $('#dashboardSelect').on('change', function () {
        DashboardManager.selectDashboard($(this).val());
    });

    // === Edit / Save / Cancel ===
    $('#btnEdit').on('click', () => DashboardManager.enableEdit());
    $('#btnSave').on('click', () => DashboardManager.saveLayout());
    $('#btnCancelEdit').on('click', () => {
        DashboardManager.disableEdit();
        if (DashboardManager.currentDashboard) {
            DashboardManager.selectDashboard(DashboardManager.currentDashboard.id);
        }
    });

    // === Refresh ===
    $('#btnRefresh').on('click', () => DashboardManager.refreshData());

    // === Theme Manager ===
    const ThemeManager = {
        init: function () {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            this.setTheme(savedTheme);
        },
        setTheme: function (theme) {
            $('html').attr('data-bs-theme', theme).attr('data-theme', theme);
            localStorage.setItem('theme', theme);

            // Update Icon
            const icon = $('#btnThemeToggle i');
            if (theme === 'light') {
                icon.removeClass('bi-moon-stars').addClass('bi-sun-fill');
                $('#btnThemeToggle').attr('data-bs-title', 'Koyu Moda Geç').tooltip('dispose').tooltip();
            } else {
                icon.removeClass('bi-sun-fill').addClass('bi-moon-stars');
                $('#btnThemeToggle').attr('data-bs-title', 'Açık Moda Geç').tooltip('dispose').tooltip();
            }
        },
        toggle: function () {
            const current = localStorage.getItem('theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            this.setTheme(next);
        }
    };
    ThemeManager.init();

    // === Theme Toggle Button ===
    $('#btnThemeToggle').on('click', function () {
        ThemeManager.toggle();
    });

    // === Fullscreen ===
    $('#btnFullscreen').on('click', function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            $(this).find('i').removeClass('bi-arrows-fullscreen').addClass('bi-fullscreen-exit');
        } else {
            document.exitFullscreen();
            $(this).find('i').removeClass('bi-fullscreen-exit').addClass('bi-arrows-fullscreen');
        }
    });

    // === Admin Modals ===
    $('#btnAdminUsers').on('click', function (e) {
        e.preventDefault();
        Admin.loadUsers();
        new bootstrap.Modal('#usersModal').show();
    });
    $('#btnAdminDashboards').on('click', function (e) {
        e.preventDefault();
        Admin.loadDashboards();
        new bootstrap.Modal('#dashboardsModal').show();
    });

    // === Add User ===
    $('#btnAddUser').on('click', () => new bootstrap.Collapse('#addUserCollapse').toggle());
    $('#addUserForm').on('submit', async function (e) {
        e.preventDefault();
        await Admin.addUser($('#newUsername').val(), $('#newPassword').val(), $('#newRole').val());
        this.reset();
        bootstrap.Collapse.getInstance('#addUserCollapse')?.hide();
    });
    $(document).on('click', '.btn-delete-user', function () { Admin.deleteUser($(this).data('id')); });

    // === Add Dashboard ===
    $('#btnAddDashboard').on('click', () => new bootstrap.Collapse('#addDashboardCollapse').toggle());
    $('#addDashboardForm').on('submit', async function (e) {
        e.preventDefault();
        await Admin.createDashboard($('#newDashboardName').val(), parseInt($('#newRefreshInterval').val() || 0), $('#newIsDefault').is(':checked'));
        this.reset();
        bootstrap.Collapse.getInstance('#addDashboardCollapse')?.hide();
    });
    $(document).on('click', '.btn-delete-dashboard', function () { Admin.deleteDashboard($(this).data('id')); });

    // === Widget Catalog (Add Widget) ===
    $('#btnAddWidget').on('click', function (e) {
        e.preventDefault();
        new bootstrap.Modal('#addWidgetModal').show();
    });

    $('.widget-catalog-item').on('click', function () {
        const type = $(this).data('widget-type');
        const subtype = $(this).data('subtype'); // e.g. for default chart type

        let initialConfig = {
            chartType: subtype || 'column',
            color: 'primary',
            title: $(this).find('span').text()
        };

        DashboardManager.addNewWidget(type, initialConfig);
        bootstrap.Modal.getInstance('#addWidgetModal')?.hide();
    });

    // === Widget Toolbar Events ===
    $(document).on('click', '.btn-widget-fullscreen', function (e) {
        e.stopPropagation();
        const wId = $(this).data('widget-id');
        openWidgetFullscreen(wId);
    });

    // === Open Config Modal ===
    $(document).on('click', '.btn-widget-config', function (e) {
        e.stopPropagation();
        const wId = $(this).data('widget-id');
        const el = document.querySelector(`[gs-id="${wId}"]`) || document.getElementById(wId);
        if (!el) return;

        // Retrieve existing config from DOM
        const bodyEl = el.querySelector('.widget-body');
        const configStr = decodeURIComponent(bodyEl.dataset.widgetConfig || '{}');
        const config = JSON.parse(configStr);
        const type = bodyEl.dataset.widgetType;

        // Populate Form
        $('#configWidgetId').val(wId);
        $('#configTitle').val(config.title || '');
        // GridStack dimensions (from node)
        const node = DashboardManager.grid.engine.nodes.find(n => n.id === wId);
        $('#configWidth').val(node?.w || 4);
        $('#configHeight').val(node?.h || 4);

        // Common & Chart Fields
        $('#configColor').val(config.color || 'primary');
        $('#configChartType').val(config.chartType || 'bar');
        $('#configGroupBy').val(config.groupBy || 'status');
        $('#configAggregation').val(config.aggregation || 'count');
        $('#configSort').val(config.sort || 'asc');

        // Pivot Fields
        $('#configPivotRows').val(config.pivotRows || 'assignee');
        $('#configPivotCols').val(config.pivotCols || 'state');

        // Embed Field
        $('#configUrl').val(config.url || '');

        // Show/Hide Sections based on Type
        $('.config-section').addClass('d-none');
        if (type === 'chart') $('#configSectionChart').removeClass('d-none');
        if (type === 'pivot-table') $('#configSectionPivot').removeClass('d-none');
        if (type === 'embedded-page') $('#configSectionEmbed').removeClass('d-none');

        new bootstrap.Modal('#widgetConfigModal').show();
    });

    // === Save Widget Config ===
    $('#widgetConfigForm').on('submit', function (e) {
        e.preventDefault();
        const wId = $('#configWidgetId').val();

        // 1. Gather all Config Fields
        let newConfig = {
            title: $('#configTitle').val(),
            color: $('#configColor').val(),
            // Chart specific
            chartType: $('#configChartType').val(),
            groupBy: $('#configGroupBy').val(),
            aggregation: $('#configAggregation').val(),
            sort: $('#configSort').val(),
            // Pivot specific
            pivotRows: $('#configPivotRows').val(),
            pivotCols: $('#configPivotCols').val(),
            // Embed specific
            url: $('#configUrl').val()
        };

        // 2. Update GridStack Size
        const w = parseInt($('#configWidth').val());
        const h = parseInt($('#configHeight').val());
        if (w && h) {
            DashboardManager.grid.update(document.querySelector(`[gs-id="${wId}"]`), { w, h });
        }

        // 3. Re-Render Content
        const el = document.querySelector(`[gs-id="${wId}"]`) || document.getElementById(wId);
        if (el) {
            const bodyEl = el.querySelector('.widget-body');
            const type = bodyEl.dataset.widgetType;

            // Re-generate inner HTML with new config
            const newContent = Widgets.createContent(wId, type, newConfig.title, newConfig);

            // GridStack update content (tricky part: we need to replace inner content of grid-stack-item-content)
            // But helper `createContent` returns header+body. We need to update existing DOM.
            const contentEl = el.querySelector('.grid-stack-item-content');
            contentEl.innerHTML = newContent;

            // If it's a chart, re-init Chart.js
            if (type === 'chart') {
                Widgets.renderChart(wId, newConfig);
            }
        }

        bootstrap.Modal.getInstance('#widgetConfigModal')?.hide();
    });

    // === Tooltip init ===
    $('[data-bs-toggle="tooltip"]').each(function () { new bootstrap.Tooltip(this); });
});

function openWidgetFullscreen(wId) {
    const el = document.querySelector(`[gs-id="${wId}"]`);
    if (!el) return;
    const bodyEl = el.querySelector('.widget-body');
    const config = JSON.parse(decodeURIComponent(bodyEl.dataset.widgetConfig || '{}'));
    const title = config.title || 'Tam Ekran';
    const type = bodyEl.dataset.widgetType;

    const overlay = document.createElement('div');
    overlay.className = 'widget-fullscreen-overlay';
    overlay.innerHTML = `
        <div class="widget-fs-header">
            <h5>${title}</h5>
            <button class="btn btn-outline-light btn-sm" id="btnCloseFs"><i class="bi bi-x-lg me-1"></i>Kapat</button>
        </div>
        <div class="widget-fs-body" id="fs-body-${wId}">
            <!-- Content will be cloned/re-rendered here -->
        </div>`;
    document.body.appendChild(overlay);

    // Re-render content for FS
    const fsContainer = overlay.querySelector(`#fs-body-${wId}`);
    if (type === 'chart') {
        fsContainer.innerHTML = `<canvas id="chart-fs-${wId}"></canvas>`;
        // Render a bigger chart
        setTimeout(() => Widgets.renderChart(`fs-${wId}`, config), 100);
    } else {
        // For static content, just clone the inner HTML
        fsContainer.innerHTML = bodyEl.innerHTML;
    }

    overlay.querySelector('#btnCloseFs').addEventListener('click', () => overlay.remove());
}

function showLogin() {
    $('#loginScreen').removeClass('d-none');
    $('#appShell').addClass('d-none');
}

async function showApp() {
    $('#loginScreen').addClass('d-none');
    $('#appShell').removeClass('d-none');
    const user = Auth.getUser();
    $('#currentUsername').text(user.username);
    $('#currentRole').text(user.role === 'Admin' ? 'Yönetici' : 'Kullanıcı');

    // Show admin controls
    if (Auth.isAdmin()) {
        $('.admin-only').removeClass('d-none');
    }

    // Init GridStack
    DashboardManager.init();

    // Load dashboard list
    const dashboards = await DashboardManager.loadDashboardList();

    // Auto-select last viewed or default
    let autoId = Auth.getLastViewedDashboardId();
    if (!autoId && dashboards && dashboards.length > 0) {
        const def = dashboards.find(d => d.isDefault);
        autoId = def ? def.id : dashboards[0].id;
    }
    if (autoId) {
        DashboardManager.selectDashboard(autoId);
    }
}

