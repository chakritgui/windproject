<script>
/**
 * @param {string} startDate - รูปแบบ 'YYYY-MM-DD'
 * @param {string} endDate - รูปแบบ 'YYYY-MM-DD'
 */
async function getFreeWeatherSummary(startDate, endDate) {
    const lat = 13.75; 
    const lon = 100.5; 

    // 1. ตรวจสอบว่าเป็นข้อมูลย้อนหลังเกิน 3 วันหรือไม่ เพื่อเลือก Base URL
    const today = new Date();
    const start = new Date(startDate);
    const diffDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    
    // ถ้าเลือกย้อนหลังเกิน 3 วัน ต้องใช้ archive-api
    const baseUrl = (diffDays > 3) 
        ? "https://archive-api.open-meteo.com/v1/archive" 
        : "https://api.open-meteo.com/v1/forecast";

    const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&air_quality=pm2_5,european_aqi&timezone=Asia%2FBangkok&start_date=${startDate}&end_date=${endDate}`;

    const calculateAverage = (arr) => arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const calculateSum = (arr) => arr && arr.length ? arr.reduce((a, b) => a + b, 0) : 0;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.reason);
            return;
        }

        console.log(`Raw Data (${startDate} to ${endDate}):`, data);

        const weather = data.hourly || {};
        const air = data.air_quality || {};

        // แสดงผลสรุป
        console.log(`=== สรุปค่าเฉลี่ยรายวัน [${startDate} ถึง ${endDate}] ===`);
        console.log(`🌡️ Average Temp: ${calculateAverage(weather.temperature_2m).toFixed(2)} °C`);
        console.log(`💧 Average Humidity: ${calculateAverage(weather.relative_humidity_2m).toFixed(2)} %`);
        console.log(`💨 Average Wind: ${calculateAverage(weather.wind_speed_10m).toFixed(2)} km/h`);
        console.log(`🌧️ Total Rain Accumulation: ${calculateSum(weather.precipitation).toFixed(2)} mm`);
        
        if (air.pm2_5) {
            console.log(`😷 Average PM 2.5: ${calculateAverage(air.pm2_5).toFixed(2)} µg/m³`);
            console.log(`📊 Average AQI: ${calculateAverage(air.european_aqi).toFixed(0)}`);
        } else {
            console.log("😷 PM 2.5: ไม่มีข้อมูลมลพิษในช่วงวันที่เลือก (Historical Air Quality อาจต้องเรียกแยก)");
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

// --- วิธีการเรียกใช้งาน ---

// ตัวอย่างที่ 1: ดูข้อมูลเฉพาะวันวันนี้ (วันที่ปัจจุบันคือ 2026-02-12)
// getFreeWeatherSummary('2026-02-12', '2026-02-12');

// ตัวอย่างที่ 2: ดูข้อมูลช่วง 3 วันที่ผ่านมา
getFreeWeatherSummary('2026-02-09', '2026-02-11');

</script>