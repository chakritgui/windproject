</div>
<div class="footer"></div>
<div id="slidePanel">
    <div class="panel-header d-flex justify-content-between align-items-center">
        <div>
            <h5 class="mb-1" id="panelTitle">ข้อมูลเสา</h5>
            <small id="panelSubtitle">รายละเอียดเสา Smart Pole</small>
        </div>
        <button class="btn btn-light" onclick="closePanel()">×</button>
    </div>
    <div class="p-4" id="panelContent"></div>
    <div id="panelFooter" class="panel-footer align-items-center"></div>
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
</body>
</html>