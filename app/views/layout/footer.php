</div>
<div class="footer">
    Copyright © 2025 iWind Corporation Limited
</div>
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
<div class="modal fade" id="polygonModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-layer-group"></i> จัดการพื้นที่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="polygonListFull"></div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="poleModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-broadcast-tower"></i> จัดการเสา</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="poleListFull"></div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="editPoleModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-edit"></i> แก้ไขข้อมูลเสา</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="editPoleForm">
                    <input type="hidden" id="editPoleId">
                    <div class="mb-3">
                        <label class="form-label">ชื่อเสา</label>
                        <input type="text" class="form-control" id="editPoleName" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Latitude</label>
                            <input type="number" step="0.000001" class="form-control" id="editPoleLat" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Longitude</label>
                            <input type="number" step="0.000001" class="form-control" id="editPoleLng" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">รายละเอียด</label>
                        <textarea class="form-control" id="editPoleDesc" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label"><i class="fas fa-camera"></i> รูปภาพ 360 องศา</label>
                        <input type="file" class="form-control" id="editPoleImage" accept="image/*">
                        <div id="imagePreview" class="mt-2"></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                <button type="button" class="btn btn-primary" onclick="savePoleEdit()">
                    <i class="fas fa-save"></i> บันทึก
                </button>
            </div>
        </div>
    </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.26.3/dist/sweetalert2.all.min.js"></script>
</body>
</html>