# 🚀 สรุปขั้นตอนขึ้น Ubuntu Server (Production)

## 🔧 สภาพแวดล้อมที่แนะนำ

* Ubuntu **20.04 / 22.04**
* RAM **อย่างน้อย 2GB** (แนะนำ 4GB)
* สิทธิ์ `sudo`
* เปิดพอร์ตที่จำเป็น

  * **MySQL** (ภายใน)
  * **5000** (LibreTranslate ถ้าเรียกจากภายนอก)

---

## 1️⃣ เตรียมระบบพื้นฐาน

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 2️⃣ ติดตั้ง Docker + Docker Compose

```bash
sudo apt install -y docker.io docker-compose
```

ตรวจสอบ:

```bash
docker --version
docker-compose --version
```

เปิด Docker อัตโนมัติ:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

(ถ้าไม่อยากพิมพ์ sudo ทุกครั้ง)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3️⃣ ติดตั้ง LibreTranslate (แนะนำใช้ Docker)

```bash
mkdir -p ~/libretranslate
cd ~/libretranslate
```

สร้างไฟล์:

```bash
nano docker-compose.yml
```

ใส่เนื้อหา:

```yaml
version: "3.8"

services:
  libretranslate:
    image: libretranslate/libretranslate:latest
    container_name: libretranslate
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - LT_LOAD_ONLY=en,th,lo
      - LT_DISABLE_WEB_UI=true
      - LT_UPDATE_MODELS=true
```

รัน:

```bash
docker-compose up -d
```

ดู log:

```bash
docker logs -f libretranslate
```

ถ้าเห็น:

```
Running on http://0.0.0.0:5000
```

= พร้อมใช้งาน ✅

---

## 4️⃣ ทดสอบ LibreTranslate

ดูภาษาที่รองรับ:

```bash
curl http://127.0.0.1:5000/languages
```

ทดสอบแปล:

```bash
curl -X POST http://127.0.0.1:5000/translate \
  -d "q=Hello world" \
  -d "source=en" \
  -d "target=th"
```

ผลลัพธ์:

```json
{"translatedText":"สวัสดีชาวโลก"}
```

---

## 5️⃣ เตรียม PHP + Composer (สำหรับ Import ล้านแถว)

ตรวจ PHP:

```bash
php -v
```

ติดตั้ง Composer:

```bash
cd ~
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer -V
```

ติดตั้ง library:

```bash
cd public_html/windproject
composer require box/spout
```

> ❗ ถ้าไม่มี SSH → ติดตั้งที่ local แล้ว upload `/vendor`

---

## 6️⃣ MySQL (สำคัญมากสำหรับ Import ล้านแถว)

* ขอ Host เปิดค่า:

```
local_infile = ON
```

ตรวจสอบ:

```sql
SHOW VARIABLES LIKE 'local_infile';
```

PDO ต้องมี:

```php
PDO::MYSQL_ATTR_LOCAL_INFILE => true
```

---

## ✅ สรุปสั้นมาก (Checklist)

* [x] Ubuntu พร้อม sudo
* [x] Docker + Docker Compose
* [x] LibreTranslate รันที่ port 5000
* [x] PHP 8 + Composer
* [x] box/spout
* [x] MySQL เปิด `local_infile`
* [x] พร้อม Import ข้อมูลระดับล้านแถว 🚀

---

เปิดใช้งานแปลงภาพเป็น WebP (Ubuntu + PHP)
🔑 สิ่งที่ต้องมี

เลือกอย่างใดอย่างหนึ่ง (หรือมีทั้งคู่ก็ดี)

✅ ทางที่ 1 (แนะนำ): GD รองรับ WebP

1️⃣ ตรวจสอบ PHP รองรับ WebP ไหม (GD)
php -i | grep -i webp


ถ้าเห็น:

WebP Support => enabled


= ผ่าน ✅

ถ้าไม่ขึ้น → ต้องติดตั้งเพิ่ม

2️⃣ ติดตั้ง PHP-GD (พร้อม WebP)
sudo apt install -y php-gd
sudo systemctl restart apache2
# หรือ php-fpm
sudo systemctl restart php8.1-fpm


ตรวจสอบซ้ำ:

php -i | grep -i webp

3️⃣ ตัวอย่างแปลงภาพเป็น WebP ด้วย PHP (GD)
$image = imagecreatefromjpeg("input.jpg");
imagewebp($image, "output.webp", 80);
imagedestroy($image);


รองรับ:

jpg

png

gif