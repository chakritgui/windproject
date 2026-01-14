<style>
    .doc-card {
        border: 2px solid #e9ecef;
        border-radius: 15px;
        transition: all 0.3s ease;
        height: 100%;
        overflow: hidden;
    }
    .doc-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        border-color: #667eea;
    }
    .doc-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        width: 80px;
        height: 80px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
    }
    .btn-download {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        transition: all 0.3s ease;
    }
    .btn-download:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        color: white;
    }
    .view-toggle .btn {
        border-radius: 10px;
    }
    .view-toggle .btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .history-item {
        border-left: 3px solid #667eea;
        padding-left: 15px;
        margin-bottom: 15px;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 10px;
    }
    .badge-custom {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .header-title {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .list-view-item {
        border: 2px solid #e9ecef;
        border-radius: 10px;
        transition: all 0.3s ease;
        margin-bottom: 15px;
    }
    .list-view-item:hover {
        border-color: #667eea;
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
    }
</style>
<div class="container py-5 mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="header-title mb-1"><i class="bi bi-file-earmark-text"></i> เอกสารค่าลมประจำเดือน</h2>
            <p class="text-muted mb-0">จัดการและดาวน์โหลดเอกสารของคุณ</p>
        </div>
        <div class="view-toggle btn-group" role="group">
            <button type="button" class="btn btn-outline-primary active" onclick="setView('grid')">
                <i class="bi bi-grid-3x3-gap"></i> ตาราง
            </button>
            <button type="button" class="btn btn-outline-primary" onclick="setView('list')">
                <i class="bi bi-list-ul"></i> รายการ
            </button>
        </div>
    </div>
    <div id="gridView" class="row g-4 mb-5">
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนมกราคม 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 31 มกราคม 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 245 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนมกราคม 2567', '450.00')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนกุมภาพันธ์ 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 29 กุมภาพันธ์ 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 238 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนกุมภาพันธ์ 2567', '380.50')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนมีนาคม 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 31 มีนาคม 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 252 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนมีนาคม 2567', '520.75')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนเมษายน 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 30 เมษายน 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 241 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนเมษายน 2567', '495.25')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนพฤษภาคม 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 31 พฤษภาคม 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 256 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนพฤษภาคม 2567', '610.00')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="doc-card card">
                <div class="card-body text-center">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 40px;"></i>
                    </div>
                    <h5 class="card-title">ค่าลมเดือนมิถุนายน 2567</h5>
                    <p class="text-muted mb-2"><i class="bi bi-calendar"></i> 30 มิถุนายน 2567</p>
                    <p class="text-muted small mb-3">ขนาด: 248 KB | PDF</p>
                    <button class="btn btn-download w-100" onclick="downloadDoc('ค่าลมเดือนมิถุนายน 2567', '680.50')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div id="listView" class="mb-5" style="display: none;">
        <div class="list-view list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนมกราคม 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 31 มกราคม 2567 | 
                        <i class="bi bi-file-earmark"></i> 245 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนมกราคม 2567', '450.00')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนกุมภาพันธ์ 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 29 กุมภาพันธ์ 2567 | 
                        <i class="bi bi-file-earmark"></i> 238 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนกุมภาพันธ์ 2567', '380.50')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนมีนาคม 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 31 มีนาคม 2567 | 
                        <i class="bi bi-file-earmark"></i> 252 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนมีนาคม 2567', '520.75')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนเมษายน 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 30 เมษายน 2567 | 
                        <i class="bi bi-file-earmark"></i> 241 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนเมษายน 2567', '495.25')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนพฤษภาคม 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 31 พฤษภาคม 2567 | 
                        <i class="bi bi-file-earmark"></i> 256 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนพฤษภาคม 2567', '610.00')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
        <div class="list-view-item p-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="doc-icon">
                        <i class="bi bi-file-earmark-pdf text-white" style="font-size: 24px;"></i>
                    </div>
                </div>
                <div class="col">
                    <h5 class="mb-1">ค่าลมเดือนมิถุนายน 2567</h5>
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> 30 มิถุนายน 2567 | 
                        <i class="bi bi-file-earmark"></i> 248 KB
                    </small>
                </div>
                <div class="col-auto">
                    <button class="btn btn-download" onclick="downloadDoc('ค่าลมเดือนมิถุนายน 2567', '680.50')">
                        <i class="bi bi-download"></i> ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="mt-5">
        <h4 class="mb-3"><i class="bi bi-clock-history"></i> ประวัติการดาวน์โหลด</h4>
        <div id="historyList">
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> ยังไม่มีประวัติการดาวน์โหลด
            </div>
        </div>
    </div>
</div>
<script>
    let downloadHistory = [];
    function setView(view) {
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const buttons = document.querySelectorAll('.view-toggle .btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        if (view === 'grid') {
            gridView.style.display = 'flex';
            listView.style.display = 'none';
            buttons[0].classList.add('active');
        } else {
            gridView.style.display = 'none';
            listView.style.display = 'block';
            buttons[1].classList.add('active');
        }
    }
    function downloadDoc(title, amount) {
        const now = new Date();
        const time = now.toLocaleTimeString('th-TH');
        const date = now.toLocaleDateString('th-TH');
        downloadHistory.unshift({
            title: title,
            amount: amount,
            time: time,
            date: date
        });
        updateHistory();
        showToast('ดาวน์โหลดสำเร็จ', `${title} ได้ถูกดาวน์โหลดแล้ว`);
    }
    function updateHistory() {
        const historyList = document.getElementById('historyList');
        if (downloadHistory.length === 0) {
            historyList.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> ยังไม่มีประวัติการดาวน์โหลด
                </div>
            `;
            return;
        }
        let html = '';
        downloadHistory.forEach((item, index) => {
            html += `
                <div class="history-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">
                                <i class="bi bi-check-circle-fill text-success"></i> ${item.title}
                            </h6>
                            <small class="text-muted">
                                <i class="bi bi-calendar3"></i> ${item.date} 
                                <i class="bi bi-clock ms-2"></i> ${item.time}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        });
        historyList.innerHTML = html;
    }
    function showToast(title, message) {
        const toastHtml = `
            <div class="position-fixed top-0 end-0 p-3" style="z-index: 11">
                <div class="toast show" role="alert">
                    <div class="toast-header bg-success text-white">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        <strong class="me-auto">${title}</strong>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;
        const temp = document.createElement('div');
        temp.innerHTML = toastHtml;
        document.body.appendChild(temp.firstElementChild);
        
        setTimeout(() => {
            const toastEl = document.querySelector('.toast');
            if (toastEl) {
                toastEl.remove();
            }
        }, 3000);
    }
</script>