<style>  
    .category-filter {
        background: white;
        border-radius: 15px;
        padding: 20px;
        margin-bottom: 30px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    .category-btn {
        margin: 5px;
        border-radius: 25px;
        padding: 8px 20px;
        border: 2px solid #667eea;
        background: white;
        color: #667eea;
        transition: all 0.3s;
    } 
    .category-btn:hover,.category-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .news-card {
        background: white;
        border-radius: 15px;
        overflow: hidden;
        transition: all 0.3s;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        margin-bottom: 30px;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .news-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.3);
    }
    .news-image-container {
        position: relative;
        width: 100%;
        height: 200px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 3rem;
    }
    .news-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-new {
        background: #ff6b6b;
        color: white;
    }
    .badge-hot {
        background: #feca57;
        color: #333;
    }
    .category-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-right: 5px;
    }
    .cat-renewable {
        background: #48dbfb;
        color: white;
    }
    .cat-weather {
        background: #ff9ff3;
        color: white;
    }
    .cat-technology {
        background: #54a0ff;
        color: white;
    }
    .cat-environment {
        background: #00d2d3;
        color: white;
    }
    .cat-research {
        background: #ff6348;
        color: white;
    }
    .news-content {
        padding: 20px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }
    .news-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #2d3436;
        margin-bottom: 10px;
        line-height: 1.4;
    }
    .news-excerpt {
        color: #636e72;
        font-size: 0.95rem;
        margin-bottom: 15px;
        line-height: 1.6;
        flex-grow: 1;
    }
    .news-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: #95a5a6;
        padding-top: 15px;
        border-top: 1px solid #ecf0f1;
    }
    .search-box {
        border-radius: 25px;
        border: 2px solid #667eea;
        padding: 10px 20px;
    }
    .search-box:focus {
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        border-color: #667eea;
    }
    .section-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 30px;
        position: relative;
        padding-bottom: 15px;
    }
</style>
<div class="container-fluid mt-3 mb-5">
    <div class="hero-section">
        <div class="container text-center">
            <h1 class="display-4 fw-bold mb-3"><i class="fas fa-wind"></i> ข่าวสารเกี่ยวกับลม</h1>
            <p class="lead">ติดตามข่าวสารพลังงานลม สภาพอากาศ และเทคโนโลยีที่เกี่ยวข้องกับลม</p>
            <div class="row justify-content-center mt-4">
                <div class="col-md-6">
                    <input type="text" class="form-control search-box" placeholder="ค้นหาข่าว..." id="searchInput">
                </div>
            </div>
        </div>
    </div>
    <div class="container">
        <div class="category-filter">
            <div class="text-center">
                <h5 class="mb-3"><i class="fas fa-filter"></i> หมวดหมู่ข่าว</h5>
                <button class="btn category-btn active" data-category="all">ทั้งหมด</button>
                <button class="btn category-btn" data-category="renewable">พลังงานหมุนเวียน</button>
                <button class="btn category-btn" data-category="weather">สภาพอากาศ</button>
                <button class="btn category-btn" data-category="technology">เทคโนโลยี</button>
                <button class="btn category-btn" data-category="environment">สิ่งแวดล้อม</button>
                <button class="btn category-btn" data-category="research">งานวิจัย</button>
            </div>
        </div>
        <div id="newsContainer" class="row"></div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/news.js?v=<?=time();?>" defer></script>