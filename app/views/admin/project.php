<link rel="stylesheet" href="<?=BASE_URL?>/public/css/admin/project.css?v=<?php echo time(); ?>">
<div class="container-fluid mt-90 mb-5">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 p-3 rounded-3 shadow-sm"
        style="background:#fff;border-left:4px solid #0d6efd;">
        <div>
            <h4 class="fw-bold mb-1 d-flex align-items-center">
                <i class="fa-solid fa-diagram-project me-2 text-primary" style="font-size:1.5rem"></i>
                <span data-i18n="project_management"></span>
            </h4>
            <nav aria-label="breadcrumb" style="margin-left: 25px;">
                <ol class="breadcrumb mb-0 small">
                    <li class="breadcrumb-item">
                        <span data-i18n="admin"></span>
                    </li>
                    <li class="breadcrumb-item active">
                        <span data-i18n="project"></span>
                    </li>
                </ol>
            </nav>
        </div>
    </div>
</div>
<div class="container-fluid mt-3 mb-5">
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb" id="breadcrumb" style="font-size: 1.1rem;">
            <li class="breadcrumb-item active" data-id="1">
                <span>ไดรฟ์ของฉัน</span>
            </li>
        </ol>
    </nav>
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
            <button class="btn btn-sm btn-outline-secondary" id="btnCreateFolder">
                <i class="fa-solid fa-folder-plus"></i> สร้างโฟลเดอร์
            </button>
            <button class="btn btn-sm btn-outline-secondary" id="btnCreateFile">
                <i class="fa-solid fa-file-circle-plus"></i> สร้างไฟล์
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-sm btn-outline-secondary active" id="viewGrid">
                <i class="fas fa-th"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="viewList">
                <i class="fas fa-list"></i>
            </button>
        </div>
    </div>
    <div id="gridView" class="row g-3"></div>
    <div id="listView" class="d-none">
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ชื่อ</th>
                    <th>เจ้าของ</th>
                    <th>แก้ไขล่าสุด</th>
                    <th>ขนาดไฟล์</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="listViewBody"></tbody>
        </table>
    </div>
    <div id="emptyState" class="text-center py-5 d-none">
        <i class="fa-solid fa-folder-open text-muted" style="font-size: 5rem;"></i>
        <h5 class="text-muted mt-3">ไม่มีไฟล์หรือโฟลเดอร์</h5>
        <p class="text-muted">คลิก "สร้างโฟลเดอร์" หรือ "สร้างไฟล์" เพื่อเริ่มต้น</p>
    </div>
</div>
<div class="modal fade" id="modalCreateFolder" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">สร้างโฟลเดอร์ใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="folderName" class="form-label">ชื่อโฟลเดอร์</label>
                    <input type="text" class="form-control" id="folderName" placeholder="โฟลเดอร์ใหม่">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                <button type="button" class="btn btn-primary" id="btnSaveFolder">สร้าง</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="modalCreateFile" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">สร้างไฟล์ใหม่</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="fileName" class="form-label">ชื่อไฟล์</label>
                    <input type="text" class="form-control" id="fileName" placeholder="ไฟล์ใหม่">
                </div>
                <div class="mb-3">
                    <label for="fileContent" class="form-label">เนื้อหา</label>
                    <textarea class="form-control" id="fileContent" rows="10" placeholder="พิมพ์เนื้อหาที่นี่..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                <button type="button" class="btn btn-primary" id="btnSaveFile">สร้าง</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="modalViewFile" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewFileTitle">ไฟล์</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <textarea class="form-control" id="viewFileContent" rows="15"></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                <button type="button" class="btn btn-primary" id="btnUpdateFile">บันทึก</button>
            </div>
        </div>
    </div>
</div>
<div id="contextMenu" class="context-menu">
    <div class="context-menu-item" data-action="open">
        <i class="fa-solid fa-folder-open me-2"></i>เปิด
    </div>
    <div class="context-menu-item" data-action="rename">
        <i class="fa-solid fa-pen-to-square me-2"></i>เปลี่ยนชื่อ
    </div>
    <div class="context-menu-item" data-action="delete">
        <i class="fa-solid fa-trash-can me-2"></i>ลบ
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/admin/project.js?v=<?=time()?>"></script>