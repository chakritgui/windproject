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
<div id="menu1" class="menu-panel"></div>
<div id="menu2" class="menu-panel"></div>
<div id="menu3" class="menu-panel"></div>
<script src="<?=BASE_URL?>/vendor/sweetalert2/dist/sweetalert2.all.min.js"></script>
<script src="<?=BASE_URL?>/public/js/helper.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/content.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/alert.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/object.js?v=<?=time();?>" defer></script>
</body>
</html>