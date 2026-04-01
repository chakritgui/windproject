</div>
<div class="footer">
    <div class="scrolling">
        <div class="scrolling-container">
            <span class="scrolling-text"></span>
        </div>
    </div>
    <div class="footer-container">
        <span class="footer-text"></span>
    </div>
</div>
<div class="modal fade" id="windModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header"></div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
        </div>
    </div>
</div>
<div class="modal fade" id="poleDetailModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg"> <div class="modal-content" style="border-radius: 15px; overflow: hidden;">
            <div class="modal-header">
                <h5 class="modal-title" id="poleModalLabel"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="poleModalBody">
                <div class="text-center p-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
            </div>
            <div class="modal-footer"></div>
        </div>
    </div>
</div>
<div class="modal fade" id="reportModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header"></div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
        </div>
    </div>
</div>
<div class="modal fade" id="vrModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-fullscreen-md-down modal-xl">
        <div class="modal-content overflow-hidden rounded-4 border-0 position-relative">
            <button type="button" class="btn btn-dark rounded-circle position-absolute d-flex align-items-center justify-content-center shadow-lg" data-bs-dismiss="modal" style="top: 15px; right: 15px; z-index: 9999; width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.3); padding: 0;"><i class="fa-solid fa-xmark fs-5 text-white"></i></button>
            <div class="modal-body p-0">
                <div id="panorama-viewer"></div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="adminContactModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header border-0">
                <h6 class="modal-title fw-bold" data-i18n="contact_admin_to_reset"></h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"></div>
        </div>
    </div>
</div>
<div class="modal fade" id="passwordModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header border-0"></div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
        </div>
    </div>
</div>
<div class="offcanvas offcanvas-end border-0 shadow" tabindex="-1" id="projectCanvas">
    <div class="oc-header">
        <div class="oc-header-left">
            <div class="status-dot" id="pp-status-dot"></div>
            <h5 class="oc-title" id="pp-name" data-i18n="project"></h5>
        </div>
        <button type="button" class="btn btn-sm btn-default" data-bs-dismiss="offcanvas" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="offcanvas-body p-0">
        <div class="oc-status-bar">
            <span data-i18n="status"></span>
            <span class="status-pill" id="pp-status"></span>
        </div>
        <div class="oc-stats-row">
            <div class="stat-cell">
                <span class="stat-label" data-i18n="wind_measurement_equipment"></span>
                <span class="stat-value" id="pp-count">0</span>
            </div>
            <div class="stat-cell">
                <span class="stat-label" data-i18n="avg_wind_speed"></span>
                <span class="stat-value" id="pp-avg-wind">0 m/s</span>
            </div>
        </div>
        <div class="oc-poles-section">
            <div class="section-label" data-i18n="wind_measurement_equipment"></div>
            <div id="pp-body"></div>
        </div>
    </div>
</div>
</body>
</html>