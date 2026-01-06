
<style>
    .cover-image {
        width: 100%;
        height: 400px;
        object-fit: cover;
        border-radius: 10px;
    }
    .project-meta {
        color: #6c757d;
        font-size: 0.9rem;
    }
    .project-content {
        line-height: 1.8;
        font-size: 1.05rem;
    }
    .content-image {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 20px 0;
    }
    .action-btn {
        border-radius: 25px;
        padding: 10px 30px;
        font-weight: 500;
        transition: all 0.3s;
    }
    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .liked {
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
        color: white !important;
    }
    .saved {
        background-color: #ffc107 !important;
        border-color: #ffc107 !important;
        color: #000 !important;
    }
    .project-card {
        transition: all 0.3s;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        height: 100%;
    }
    .project-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .project-card img {
        height: 200px;
        object-fit: cover;
    }
    .section-title {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 3px solid #0d6efd;
    }
    .badge-trending {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .trending-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 30px;
    }
    .trending-item {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .trending-item:hover {
        background: rgba(255,255,255,0.2);
        transform: translateX(5px);
    }
</style>
<div class="container my-5">
    <div class="row">
        <div class="col-lg-8">
            <img src="https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1200" alt="Wind Project Cover" class="cover-image mb-4">
            <div class="mb-4">
                <h1 class="display-5 fw-bold mb-3">พายุลมแรงพัดถึงไทย คาดกระทบหลายจังหวัดในสัปดาห์นี้</h1>
                <div class="project-meta">
                    <i class="bi bi-calendar3"></i> 13 ธันวาคม 2567 | 
                    <i class="bi bi-person"></i> โดย นักข่าวสภาพอากาศ | 
                    <i class="bi bi-eye"></i> 12,458 ครั้ง
                </div>
            </div>
            <div class="mb-4">
                <button id="likeBtn" class="btn btn-outline-danger action-btn me-2">
                    <i class="bi bi-heart"></i> ถูกใจ <span id="likeCount">(1,234)</span>
                </button>
                <button id="saveBtn" class="btn btn-outline-warning action-btn">
                    <i class="bi bi-bookmark"></i> บันทึก
                </button>
            </div>
            <div class="bg-white p-4 rounded shadow-sm">
                <div class="project-content">
                    <p>กรมอุตุนิยมวิทยารายงานว่า มีพายุหมุนเขตร้อนกำลังเคลื่อนตัวเข้าสู่ประเทศไทย คาดว่าจะส่งผลให้เกิดลมแรงและฝนตกหนักในหลายพื้นที่ โดยเฉพาะภาคเหนือและภาคตะวันออกเฉียงเหนือ</p>
                    <img src="https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800" alt="Wind Pattern" class="content-image">
                    <p>นายสมชาย วงศ์ใหญ่ อธิบดีกรมอุตุนิยมวิทยา เปิดเผยว่า ลมมรสุมตะวันออกเฉียงเหนือที่พัดปกคลุมประเทศไทยและอ่าวไทยมีกำลังแรงขึ้น ทำให้บริเวณภาคเหนือ ภาคตะวันออกเฉียงเหนือ และภาคกลาง มีอากาศหนาวเย็น และมีลมแรง</p>
                    <h3 class="mt-4 mb-3">พื้นที่ที่ได้รับผลกระทบ</h3>
                    <p>พื้นที่ที่คาดว่าจะได้รับผลกระทบมากที่สุด ได้แก่ จังหวัดเชียงใหม่ เชียงราย ลำปาง พะเยา และแม่ฮ่องสอน ซึ่งอาจมีลมกระโชกแรงถึง 60-70 กิโลเมตรต่อชั่วโมง</p>
                    <img src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800" alt="Storm Coming" class="content-image">
                    <h3 class="mt-4 mb-3">คำแนะนำสำหรับประชาชน</h3>
                    <p>ประชาชนในพื้นที่เสี่ยงควรระมัดระวังอันตรายจากลมกระโชกแรง โดยเฉพาะป้ายโฆษณาขนาดใหญ่ และต้นไม้ใหญ่ที่อาจหักโค่นได้ นอกจากนี้ ควรหลีกเลี่ยงการเดินทางในพื้นที่เสี่ยง และติดตามข่าวสารจากกรมอุตุนิยมวิทยาอย่างใกล้ชิด</p>
                    <p>สำหรับเกษตรกรควรเตรียมมาตรการป้องกันพืชผลและปศุสัตว์ อาจต้องมีการเสริมความแข็งแรงของโรงเรือนและคอกสัตว์ เพื่อรองรับสภาพอากาศที่เลวร้ายที่กำลังจะเกิดขึ้น</p>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="trending-card">
                <h4 class="mb-3"><i class="bi bi-fire"></i> ข่าวที่กำลังได้รับความสนใจ</h4>
                <div class="trending-item">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark me-2">1</span>
                        <span>พายุโซนร้อนเคลื่อนตัวเร็วขึ้น</span>
                    </div>
                </div>
                <div class="trending-item">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark me-2">2</span>
                        <span>อุณหภูมิลดลง 5-7 องศา</span>
                    </div>
                </div>
                <div class="trending-item">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark me-2">3</span>
                        <span>เตือนคลื่นลมแรงในอ่าวไทย</span>
                    </div>
                </div>
                <div class="trending-item">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark me-2">4</span>
                        <span>ฝนตกหนักต่อเนื่อง 3 วัน</span>
                    </div>
                </div>
                <div class="trending-item">
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark me-2">5</span>
                        <span>ภาคใต้เตรียมรับมือน้ำท่วม</span>
                    </div>
                </div>
            </div>
            <div class="bg-white p-3 rounded shadow-sm mb-4">
                <h5 class="section-title">ข่าวใหม่ 5 ข่าวล่าสุด</h5>
                <div class="list-group list-group-flush">
                    <a href="#" class="list-group-item list-group-item-action">
                        <div class="d-flex">
                            <img src="https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">ลมมรสุมแรงขึ้นในสัปดาห์หน้า</h6>
                                <small class="text-muted">2 ชั่วโมงที่แล้ว</small>
                            </div>
                        </div>
                    </a>
                    <a href="#" class="list-group-item list-group-item-action">
                        <div class="d-flex">
                            <img src="https://images.unsplash.com/photo-1451847251646-8a6c0dd1510c?w=100" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">พยากรณ์อากาศ 7 วันข้างหน้า</h6>
                                <small class="text-muted">5 ชั่วโมงที่แล้ว</small>
                            </div>
                        </div>
                    </a>
                    <a href="#" class="list-group-item list-group-item-action">
                        <div class="d-flex">
                            <img src="https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">เฝ้าระวังคลื่นสูงในทะเลอันดามัน</h6>
                                <small class="text-muted">8 ชั่วโมงที่แล้ว</small>
                            </div>
                        </div>
                    </a>
                    <a href="#" class="list-group-item list-group-item-action">
                        <div class="d-flex">
                            <img src="https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?w=100" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">อากาศหนาวจัดบนยอดดอย</h6>
                                <small class="text-muted">12 ชั่วโมงที่แล้ว</small>
                            </div>
                        </div>
                    </a>
                    <a href="#" class="list-group-item list-group-item-action">
                        <div class="d-flex">
                            <img src="https://images.unsplash.com/photo-1451847251646-8a6c0dd1510c?w=100" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                            <div>
                                <h6 class="mb-1">ปรากฏการณ์เอลนีโญคาดจะสิ้นสุด</h6>
                                <small class="text-muted">1 วันที่แล้ว</small>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="row mt-5">
        <div class="col-12">
            <h4 class="section-title">ข่าวที่น่าสนใจ</h4>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400" class="card-img-top" alt="Project 1">
                <div class="card-body">
                    <span class="badge bg-primary mb-2">สภาพอากาศ</span>
                    <h5 class="card-title">พลังงานลมทางเลือกใหม่ของไทย</h5>
                    <p class="card-text text-muted">การพัฒนาฟาร์มกังหันลมในอ่าวไทยเพื่อสร้างพลังงานสะอาด</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 2 วันที่แล้ว</small>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1601134991665-a020399422e3?w=400" class="card-img-top" alt="Project 2">
                <div class="card-body">
                    <span class="badge bg-success mb-2">วิทยาศาสตร์</span>
                    <h5 class="card-title">ความสัมพันธ์ระหว่างลมและการเปลี่ยนแปลงสภาพภูมิอากาศ</h5>
                    <p class="card-text text-muted">นักวิทยาศาสตร์เผยผลกระทบของภาวะโลกร้อนต่อทิศทางลม</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 3 วันที่แล้ว</small>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400" class="card-img-top" alt="Project 3">
                <div class="card-body">
                    <span class="badge bg-danger mb-2">เตือนภัย</span>
                    <h5 class="card-title">เทคนิคการเอาตัวรอดจากพายุลมแรง</h5>
                    <p class="card-text text-muted">แนวทางปฏิบัติเมื่อเจอสถานการณ์พายุลมแรงกระชาก</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 4 วันที่แล้ว</small>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400" class="card-img-top" alt="Project 4">
                <div class="card-body">
                    <span class="badge bg-info mb-2">เทคโนโลยี</span>
                    <h5 class="card-title">ระบบพยากรณ์อากาศรุ่นใหม่แม่นยำกว่าเดิม</h5>
                    <p class="card-text text-muted">AI ช่วยวิเคราะห์รูปแบบลมและทำนายสภาพอากาศ</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 5 วันที่แล้ว</small>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400" class="card-img-top" alt="Project 5">
                <div class="card-body">
                    <span class="badge bg-warning text-dark mb-2">ท่องเที่ยว</span>
                    <h5 class="card-title">จุดชมวิวลมทะเลที่สวยที่สุดในไทย</h5>
                    <p class="card-text text-muted">10 สถานที่ท่องเที่ยวที่มีบรรยากาศลมทะเลสดชื่น</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 6 วันที่แล้ว</small>
                </div>
            </div>
        </div>
        <div class="col-md-4 mb-4">
            <div class="card project-card">
                <img src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400" class="card-img-top" alt="Project 6">
                <div class="card-body">
                    <span class="badge bg-secondary mb-2">การเกษตร</span>
                    <h5 class="card-title">ผลกระทบของลมแรงต่อพืชผลทางการเกษตร</h5>
                    <p class="card-text text-muted">เกษตรกรควรรู้วิธีป้องกันความเสียหายจากลมพายุ</p>
                    <small class="text-muted"><i class="bi bi-clock"></i> 1 สัปดาห์ที่แล้ว</small>
                </div>
            </div>
        </div>
    </div>
</div>
<script>
    let liked = false;
    let likeCount = 1234;
    const likeBtn = document.getElementById('likeBtn');
    const likeCountSpan = document.getElementById('likeCount');
    likeBtn.addEventListener('click', function() {
        if (!liked) {
            liked = true;
            likeCount++;
            this.classList.add('liked');
            this.innerHTML = '<i class="bi bi-heart-fill"></i> ถูกใจแล้ว <span id="likeCount">(' + likeCount.toLocaleString() + ')</span>';
        } else {
            liked = false;
            likeCount--;
            this.classList.remove('liked');
            this.innerHTML = '<i class="bi bi-heart"></i> ถูกใจ <span id="likeCount">(' + likeCount.toLocaleString() + ')</span>';
        }
    });
    let saved = false;
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', function() {
        if (!saved) {
            saved = true;
            this.classList.add('saved');
            this.innerHTML = '<i class="bi bi-bookmark-fill"></i> บันทึกแล้ว';
            showToast('บันทึกข่าวเรียบร้อยแล้ว!');
        } else {
            saved = false;
            this.classList.remove('saved');
            this.innerHTML = '<i class="bi bi-bookmark"></i> บันทึก';
            showToast('ยกเลิกการบันทึกแล้ว');
        }
    });
    function showToast(message) {
        const toastDiv = document.createElement('div');
        toastDiv.className = 'position-fixed bottom-0 end-0 p-3';
        toastDiv.style.zIndex = '11';
        toastDiv.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <strong class="me-auto">การแจ้งเตือน</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        document.body.appendChild(toastDiv);
        setTimeout(() => {
            toastDiv.remove();
        }, 3000);
    }
</script>