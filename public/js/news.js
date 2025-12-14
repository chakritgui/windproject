const newsData = [
    {id: 1, title: "โครงการกังหันลมนอกชายฝั่งใหม่ในอ่าวไทยเริ่มก่อสร้าง", excerpt: "รัฐบาลอนุมัติโครงการกังหันลมขนาดใหญ่นอกชายฝั่งที่จะผลิตไฟฟ้าได้ถึง 500 เมกะวัตต์", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-12-10", views: 1250, isNew: true, isHot: true},
    {id: 2, title: "พายุหมุนเขตร้อนกำลังเข้าสู่ภาคใต้ ประชาชนควรเตรียมพร้อม", excerpt: "กรมอุตุนิยมวิทยาเตือนพายุกำลังแรงจะเข้าสู่ฝั่งภาคใต้ในช่วง 48 ชั่วโมงข้างหน้า", category: "weather", categoryName: "สภาพอากาศ", date: "2025-12-10", views: 2340, isNew: true, isHot: true},
    {id: 3, title: "นวัตกรรมกังหันลมรุ่นใหม่ประหยัดพื้นที่ 40%", excerpt: "บริษัทญี่ปุ่นพัฒนากังหันลมแนวตั้งที่สามารถติดตั้งในพื้นที่จำกัดได้อย่างมีประสิทธิภาพ", category: "technology", categoryName: "เทคโนโลยี", date: "2025-12-09", views: 890, isNew: true, isHot: false},
    {id: 4, title: "ความเร็วลมเฉลี่ยทั่วโลกเพิ่มขึ้นในรอบ 10 ปี", excerpt: "การศึกษาพบว่าความเร็วลมเฉลี่ยทั่วโลกเพิ่มขึ้น 7% ซึ่งส่งผลดีต่อการผลิตพลังงานลม", category: "research", categoryName: "งานวิจัย", date: "2025-12-09", views: 670, isNew: true, isHot: false},
    {id: 5, title: "พลังงานลมช่วยลดการปล่อยคาร์บอนได้ 30 ล้านตันต่อปี", excerpt: "รายงานชี้พลังงานลมในเอเชียตะวันออกเฉียงใต้ช่วยลดการปล่อย CO2 อย่างมีนัยสำคัญ", category: "environment", categoryName: "สิ่งแวดล้อม", date: "2025-12-08", views: 1120, isNew: false, isHot: true},
    {id: 6, title: "ลมมรสุมตะวันออกเฉียงเหนือพัดปกคลุมประเทศไทย", excerpt: "อากาศเย็นลงในภาคเหนือและภาคตะวันออกเฉียงเหนือ ประชาชนควรดูแลสุขภาพ", category: "weather", categoryName: "สภาพอากาศ", date: "2025-12-08", views: 1890, isNew: false, isHot: true},
    {id: 7, title: "ประเทศไทยตั้งเป้าเพิ่มพลังงานลม 3,000 MW ภายในปี 2030", excerpt: "กระทรวงพลังงานเผยแผนยุทธศาสตร์เพิ่มสัดส่วนพลังงานหมุนเวียนจากลม", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-12-07", views: 950, isNew: false, isHot: false},
    {id: 8, title: "AI ช่วยพยากรณ์ทิศทางลมแม่นยำขึ้น 25%", excerpt: "เทคโนโลยี Machine Learning ช่วยปรับปรุงความแม่นยำในการทำนายทิศทางและความเร็วลม", category: "technology", categoryName: "เทคโนโลยี", date: "2025-12-07", views: 780, isNew: false, isHot: false},
    {id: 9, title: "ผลกระทบของลมต่อการกระจายละอองฝุ่น PM2.5", excerpt: "การศึกษาชี้ว่าทิศทางลมมีผลสำคัญต่อการกระจายตัวของฝุ่นละอองในเมืองใหญ่", category: "environment", categoryName: "สิ่งแวดล้อม", date: "2025-12-06", views: 1450, isNew: false, isHot: true},
    {id: 10, title: "กังหันลมลอยน้ำ: อนาคตของพลังงานทะเล", excerpt: "นักวิจัยพัฒนากังหันลมลอยน้ำที่สามารถติดตั้งในทะเลลึกได้โดยไม่ต้องปักฐาน", category: "technology", categoryName: "เทคโนโลยี", date: "2025-12-06", views: 1230, isNew: false, isHot: false},
    {id: 11, title: "พายุไซโคลนในมหาสมุทรอินเดียมีความรุนแรงเพิ่มขึ้น", excerpt: "ข้อมูลย้อนหลัง 50 ปีชี้ว่าพายุไซโคลนมีความรุนแรงมากขึ้นเนื่องจากการเปลี่ยนแปลงสภาพภูมิอากาศ", category: "weather", categoryName: "สภาพอากาศ", date: "2025-12-05", views: 2100, isNew: false, isHot: true},
    {id: 12, title: "ชุมชนท้องถิ่นได้รับประโยชน์จากฟาร์มกังหันลม", excerpt: "โครงการกังหันลมในภาคอีสานสร้างรายได้ให้ชุมชนและส่งเสริมการท่องเที่ยว", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-12-05", views: 680, isNew: false, isHot: false},
    {id: 13, title: "แผนที่ลมดิจิทัลช่วยวางแผนโครงการพลังงาน", excerpt: "รัฐบาลเปิดตัวแผนที่ลมออนไลน์ที่แสดงศักยภาพการผลิตพลังงานลมทั่วประเทศ", category: "technology", categoryName: "เทคโนโลยี", date: "2025-12-04", views: 560, isNew: false, isHot: false},
    {id: 14, title: "การเปลี่ยนแปลงของกระแสลมเจ็ทสตรีมส่งผลต่อสภาพอากาศ", excerpt: "นักวิทยาศาสตร์พบว่ากระแสลมชั้นบนเคลื่อนตัวผิดปกติมากขึ้น", category: "research", categoryName: "งานวิจัย", date: "2025-12-04", views: 890, isNew: false, isHot: false},
    {id: 15, title: "นกอพยพเปลี่ยนเส้นทางเพื่อหลีกเลี่ยงฟาร์มกังหันลม", excerpt: "การศึกษาใหม่แสดงให้เห็นว่านกสามารถปรับตัวและหลีกเลี่ยงกังหันลมได้ดีกว่าที่คิด", category: "environment", categoryName: "สิ่งแวดล้อม", date: "2025-12-03", views: 720, isNew: false, isHot: false},
    {id: 16, title: "เทคโนโลยีเก็บพลังงานจากลมในแบตเตอรี่ขนาดใหญ่", excerpt: "บริษัทพลังงานทดสอบระบบแบตเตอรี่ขนาดยักษ์เพื่อเก็บพลังงานจากลมไว้ใช้ยามค่ำคืน", category: "technology", categoryName: "เทคโนโลยี", date: "2025-12-03", views: 1340, isNew: false, isHot: true},
    {id: 17, title: "ลมฟ้อนในทะเลทรายซาฮารา: ปรากฏการณ์ที่น่าอัศจรรย์", excerpt: "นักวิทยาศาสตร์บันทึกภาพลมฟ้อนขนาดใหญ่ที่เกิดขึ้นในทะเลทรายซาฮารา", category: "weather", categoryName: "สภาพอากาศ", date: "2025-12-02", views: 1560, isNew: false, isHot: false},
    {id: 18, title: "การลงทุนพลังงานลมทั่วโลกพุ่งสูงสุดเป็นประวัติการณ์", excerpt: "ปี 2025 มีการลงทุนในโครงการพลังงานลมสูงถึง 200 พันล้านดอลลาร์", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-12-02", views: 980, isNew: false, isHot: false},
    {id: 19, title: "วิจัยใหม่: ลมมีผลต่อการสื่อสารของสัตว์", excerpt: "การศึกษาพบว่าสัตว์หลายชนิดปรับวิธีการสื่อสารเมื่อมีลมแรง", category: "research", categoryName: "งานวิจัย", date: "2025-12-01", views: 450, isNew: false, isHot: false},
    {id: 20, title: "กังหันลมขนาดเล็กสำหรับบ้านเดี่ยวเริ่มได้รับความนิยม", excerpt: "ผู้บริโภคหันมาสนใจติดตั้งกังหันลมขนาดเล็กที่บ้านเพื่อลดค่าไฟฟ้า", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-12-01", views: 1100, isNew: false, isHot: false},
    {id: 21, title: "ลมหนาวจากไซบีเรียส่งผลต่ออุณหภูมิในเอเชีย", excerpt: "กระแสลมเย็นจากไซบีเรียเคลื่อนตัวลงสู่เอเชียตะวันออก ทำให้อุณหภูมิลดลงอย่างเห็นได้ชัด", category: "weather", categoryName: "สภาพอากาศ", date: "2025-11-30", views: 1670, isNew: false, isHot: false},
    {id: 22, title: "เซ็นเซอร์อัจฉริยะตรวจสอบสภาพกังหันลมแบบเรียลไทม์", excerpt: "เทคโนโลยี IoT ช่วยตรวจจับปัญหาของกังหันลมก่อนเกิดความเสียหายร้ายแรง", category: "technology", categoryName: "เทคโนโลยี", date: "2025-11-30", views: 820, isNew: false, isHot: false},
    {id: 23, title: "ผลกระทบของลมต่อการแพร่กระจายของเชื้อโรค", excerpt: "นักวิจัยพบว่าทิศทางและความเร็วลมมีผลต่อการแพร่กระจายของเชื้อโรคทางอากาศ", category: "research", categoryName: "งานวิจัย", date: "2025-11-29", views: 1240, isNew: false, isHot: false},
    {id: 24, title: "ฟาร์มกังหันลมทะเลช่วยสร้างแหล่งที่อยู่อาศัยให้สัตว์น้ำ", excerpt: "การศึกษาพบว่าฐานรากของกังหันลมในทะเลกลายเป็นแนวปะการังเทียม", category: "environment", categoryName: "สิ่งแวดล้อม", date: "2025-11-29", views: 790, isNew: false, isHot: false},
    {id: 25, title: "โดรนตรวจสอบกังหันลมลดต้นทุนการบำรุงรักษา 50%", excerpt: "การใช้โดรนในการตรวจสอบกังหันลมช่วยประหยัดเวลาและค่าใช้จ่ายอย่างมาก", category: "technology", categoryName: "เทคโนโลยี", date: "2025-11-28", views: 670, isNew: false, isHot: false},
    {id: 26, title: "ลมมรสุมตะวันตกเฉียงใต้เริ่มเข้าสู่ประเทศไทยเร็วกว่าปกติ", excerpt: "กรมอุตุนิยมวิทยาระบุว่าลมมรสุมปีนี้เข้าสู่ไทยเร็วกว่าทุกปี", category: "weather", categoryName: "สภาพอากาศ", date: "2025-11-28", views: 1450, isNew: false, isHot: false},
    {id: 27, title: "พลังงานลมสร้างงานให้คนไทยกว่า 10,000 ตำแหน่ง", excerpt: "อุตสาหกรรมพลังงานลมในไทยขยายตัวและสร้างโอกาสการจ้างงานเพิ่มขึ้น", category: "renewable", categoryName: "พลังงานหมุนเวียน", date: "2025-11-27", views: 890, isNew: false, isHot: false},
    {id: 28, title: "การพัฒนาใบพัดกังหันลมที่เงียบและมีประสิทธิภาพสูง", excerpt: "วิศวกรพัฒนาใบพัดรุ่นใหม่ที่ลดเสียงรบกวนและเพิ่มประสิทธิภาพการผลิตพลังงาน", category: "technology", categoryName: "เทคโนโลยี", date: "2025-11-27", views: 540, isNew: false, isHot: false},
    {id: 29, title: "ลมค้าขั้วโลกมีผลต่อระบบนิเวศทางทะเล", excerpt: "งานวิจัยแสดงให้เห็นว่าลมค้าขั้วโลกมีบทบาทสำคัญในการหมุนเวียนสารอาหารในมหาสมุทร", category: "research", categoryName: "งานวิจัย", date: "2025-11-26", views: 620, isNew: false, isHot: false},
    {id: 30, title: "โครงการป่าชายเลนช่วยลดผลกระทบจากลมพายุ", excerpt: "การปลูกป่าชายเลนในพื้นที่ชายฝั่งช่วยป้องกันความเสียหายจากพายุและคลื่นลมแรง", category: "environment", categoryName: "สิ่งแวดล้อม", date: "2025-11-26", views: 980, isNew: false, isHot: false}
];
let filteredNews = [...newsData];
let currentCategory = 'all';
function renderNews(news) {
    const container = document.getElementById('newsContainer');
    container.innerHTML = '';
    news.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        const badges = [];
        if (item.isNew) badges.push('<span class="news-badge badge-new">ใหม่</span>');
        if (item.isHot) badges.push('<span class="news-badge badge-hot">ฮอต</span>');
        col.innerHTML = `
            <a href="${BASE_URL}/news/${item.slug || '8d6121e3-cfb2-4053-b840-3a416bba83bd'}" class="news-card d-block text-decoration-none"  target="_blank" rel="noopener">
                <div class="news-image-container">
                    <i class="fas fa-wind"></i>
                    ${badges.join('')}
                </div>
                <div class="news-content">
                    <div>
                        <span class="category-badge cat-${item.category}">${item.categoryName}</span>
                    </div>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-excerpt">${item.excerpt}</p>
                    <div class="news-meta">
                        <span><i class="far fa-calendar"></i> ${item.date}</span>
                        <span><i class="far fa-eye"></i> ${item.views.toLocaleString()}</span>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(col);
    });
}
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        filterNews();
    });
});
document.getElementById('searchInput').addEventListener('input', function(e) {
    filterNews();
});
function filterNews() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredNews = newsData.filter(news => {
        const matchCategory = currentCategory === 'all' || news.category === currentCategory;
        const matchSearch = news.title.toLowerCase().includes(searchTerm) || news.excerpt.toLowerCase().includes(searchTerm);
        return matchCategory && matchSearch;
    });
    renderNews(filteredNews);
}
renderNews(newsData);