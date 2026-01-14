
<style>
    .profile-img {
        width: 90px; height: 90px; border-radius: 50%;
        object-fit: cover; border: 3px solid #fff;
        box-shadow: 0 0 6px #ccc;
    }
    .tab-content {
        margin-top: 25px;
    }
    .section-title {
        font-size: 1.2rem; font-weight: 600;
        border-left: 4px solid #0d6efd;
        padding-left: 10px; margin-bottom: 15px;
    }
</style>
</head>
<body>
<div class="container py-5 mt-5">
    <div class="card shadow-sm mb-4">
        <div class="card-body d-flex align-items-center">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="profile-img me-3">
            <div>
                <h4 class="mb-1">Heng Like</h4>
                <div class="text-muted">User Profile Settings</div>
            </div>
        </div>
    </div>
    <ul class="nav nav-tabs" id="profileTabs" role="tablist">
        <li class="nav-item">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#personal" type="button">
                <i class="bi bi-person-fill me-1"></i> ข้อมูลส่วนตัว
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#contact">
                <i class="bi bi-telephone-fill me-1"></i> การติดต่อ
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#work">
                <i class="bi bi-briefcase-fill me-1"></i> การทำงาน
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#username">
                <i class="bi bi-person-badge-fill me-1"></i> ชื่อผู้ใช้
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#password">
                <i class="bi bi-key-fill me-1"></i> รหัสผ่าน
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#loginlog">
                <i class="bi bi-clock-history me-1"></i> ประวัติการเข้าใช้
            </button>
        </li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="personal">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">ข้อมูลส่วนตัว</div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">ชื่อจริง</label>
                            <input type="text" class="form-control" placeholder="First name">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">นามสกุล</label>
                            <input type="text" class="form-control" placeholder="Last name">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">วันเกิด</label>
                            <input type="date" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">เพศ</label>
                            <select class="form-select">
                                <option>ชาย</option>
                                <option>หญิง</option>
                                <option>ไม่ระบุ</option>
                            </select>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="contact">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">ข้อมูลการติดต่อ</div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">อีเมล</label>
                            <input type="email" class="form-control" placeholder="example@mail.com">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">เบอร์โทรศัพท์</label>
                            <input type="text" class="form-control" placeholder="0812345678">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">จังหวัด</label>
                            <select class="form-select">
                                <option>กรุงเทพมหานคร</option>
                                <option>เชียงใหม่</option>
                                <option>ขอนแก่น</option>
                            </select>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">ที่อยู่</label>
                            <textarea class="form-control" rows="2" placeholder="บ้านเลขที่ / ถนน / แขวง / เขต"></textarea>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="work">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">ข้อมูลการทำงาน</div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">ตำแหน่ง</label>
                            <input type="text" class="form-control" placeholder="ตำแหน่งงาน">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">แผนก</label>
                            <input type="text" class="form-control" placeholder="แผนก">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">วันที่เริ่มงาน</label>
                            <input type="date" class="form-control">
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="username">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">เปลี่ยนชื่อผู้ใช้</div>
                    <div class="col-md-4">
                        <label class="form-label">ชื่อผู้ใช้ใหม่</label>
                        <input type="text" class="form-control" placeholder="New username">
                    </div>

                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="password">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">เปลี่ยนรหัสผ่าน</div>
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">รหัสผ่านเดิม</label>
                            <input type="password" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">รหัสผ่านใหม่</label>
                            <input type="password" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">ยืนยันรหัสผ่านใหม่</label>
                            <input type="password" class="form-control">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="tab-pane fade" id="loginlog">
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <div class="section-title">ประวัติการลงชื่อเข้าใช้</div>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>วันที่</th>
                                    <th>ไอพี</th>
                                    <th>อุปกรณ์</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2025-12-10 08:43</td>
                                    <td>192.168.1.15</td>
                                    <td>Windows / Chrome</td>
                                    <td><span class="badge bg-success">สำเร็จ</span></td>
                                </tr>
                                <tr>
                                    <td>2025-12-09 21:15</td>
                                    <td>10.20.33.41</td>
                                    <td>iPhone / Safari</td>
                                    <td><span class="badge bg-danger">ล้มเหลว</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>