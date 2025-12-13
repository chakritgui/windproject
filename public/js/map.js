mapboxgl.accessToken = 'pk.eyJ1IjoiamFra3JpdGd1aSIsImEiOiJjbWgzazI4ZmwzNHpiMmpvZWlrcGVuZWJzIn0.hM4EeFAT3ytiy5F69sTGDg';
    const bounds = [[102.55, 17.90], [102.70, 18.04]];
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [102.6331, 17.9757],
        zoom: 13.5,
        pitch: 70,
        bearing: -45,
        antialias: true,
        maxBounds: bounds
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
    map.on('load', () => {
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
        map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.5, 0.8],
                'sky-atmosphere-sun-intensity': 18
            }
        });
        const areas = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": { "id": "A", "name": "พื้นที่โซน A", "color": "#7b3294", "height": 22 },
                    "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [102.5965, 17.9680],
                        [102.6030, 17.9655],
                        [102.6060, 17.9695],
                        [102.6040, 17.9740],
                        [102.5985, 17.9730],
                        [102.5965, 17.9680]
                    ]]
                }
            },{
                "type": "Feature",
                "properties": { "id": "B", "name": "พื้นที่โซน B", "color": "#1fa3a3", "height": 22 },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [102.6250, 17.9550],
                        [102.6310, 17.9530],
                        [102.6350, 17.9585],
                        [102.6330, 17.9620],
                        [102.6270, 17.9635],
                        [102.6250, 17.9550]
                    ]]
                }
            },{
                "type": "Feature",
                "properties": { "id": "C", "name": "พื้นที่โซน C", "color": "#e07b3b", "height": 22 },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [102.6145, 17.9850],
                        [102.6210, 17.9860],
                        [102.6240, 17.9900],
                        [102.6220, 17.9945],
                        [102.6165, 17.9950],
                        [102.6135, 17.9910],
                        [102.6145, 17.9850]
                    ]]
                }
            }]
        };
        map.addSource('areas', { type:'geojson', data: areas });
            map.addLayer({
            id:'areas-3d',
            type:'fill-extrusion',
            source:'areas',
            paint:{
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-opacity': 0.7,
                'fill-extrusion-base': 0
            }
        });
        map.addLayer({
            id:'areas-line',
            type:'line',
            source:'areas',
            paint:{ 'line-color':'#888', 'line-width':1 }
        });
        map.on('click', 'areas-3d', (e) => {
            const feature = e.features[0];
            const coords = feature.geometry.coordinates[0];
            const bounds = coords.reduce(function(bounds, coord) {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
            map.flyTo({
                center: bounds.getCenter(),
                zoom: 15.5,
                pitch: 75,
                bearing: -20,
                duration: 2000
            });
        });
        const poles = [{ 
            id:1, 
            name:'เสา A1', 
            coords:[102.6008,17.9682], 
            color:'red', 
            info:'สูง 12 เมตร',
            status: 'ปกติ',
            installDate: '15/01/2023',
            type: 'Smart Pole Type A',
            power: '220V',
            images: [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
                'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
                'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400'
            ],
            images360: [
                'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
            ]
        },{ 
            id:2, 
            name:'เสา A2', 
            coords:[102.6035,17.9710], 
            color:'green', 
            info:'สูง 15 เมตร',
            status: 'ปกติ',
            installDate: '20/02/2023',
            type: 'Smart Pole Type B',
            power: '220V',
            images: [
                'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
                'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400'
            ],
            images360: [
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
            ]
        },{ 
            id:3, 
            name:'เสา B1', 
            coords:[102.6306,17.9588], 
            color:'blue', 
            info:'สูง 20 เมตร',
            status: 'ซ่อมบำรุง',
            installDate: '10/03/2023',
            type: 'Smart Pole Type C',
            power: '380V',
            images: [
                'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400',
                'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
                'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400'
            ],
            images360: [
                'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
            ]
        },{ 
            id:4, 
            name:'เสา C1', 
            coords:[102.6189,17.9891], 
            color:'red', 
            info:'สูง 10 เมตร',
            status: 'ปกติ',
            installDate: '05/04/2023',
            type: 'Smart Pole Type A',
            power: '220V',
            images: [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
            ],
            images360: [
                'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800'
            ]
        }];
        poles.forEach(p => {
            const el = document.createElement('div');
            el.className = 'marker ' + p.color;
            el.onclick = () => openPolePanel(p);
            new mapboxgl.Marker(el)
                .setLngLat(p.coords)
                .addTo(map);
        });
    });
    function openPolePanel(pole) {
        const panel = document.getElementById('slidePanel');
        const content = document.getElementById('panelContent');
        document.getElementById('panelTitle').textContent = pole.name;
        document.getElementById('panelSubtitle').textContent = pole.type;
        const statusColor = pole.status === 'ปกติ' ? 'success' : 'warning';
        content.innerHTML = `
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="text-muted mb-0">สถานะ</h6>
                    <span class="badge bg-${statusColor} badge-status">${pole.status}</span>
                </div>
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-3 text-muted"><i class="bi bi-info-circle"></i> ข้อมูลทั่วไป</h6>
                        <div class="row g-2">
                            <div class="col-6">
                                <small class="text-muted d-block">ชื่อเสา</small>
                                <strong>${pole.name}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">ประเภท</small>
                                <strong>${pole.type}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">ความสูง</small>
                                <strong>${pole.info}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">แรงดันไฟฟ้า</small>
                                <strong>${pole.power}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">วันที่ติดตั้ง</small>
                                <strong>${pole.installDate}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-subtitle mb-2 text-muted"><i class="bi bi-geo-alt"></i> พิกัด</h6>
                        <div class="row g-2">
                            <div class="col-6">
                                <small class="text-muted d-block">Latitude</small>
                                <strong>${pole.coords[1].toFixed(6)}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Longitude</small>
                                <strong>${pole.coords[0].toFixed(6)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <h6 class="text-muted mb-2"><i class="bi bi-images"></i> Gallery รูปภาพ</h6>
                    <div class="row g-2">
                        ${pole.images.map((img, idx) => `
                            <div class="col-4">
                                <a data-fancybox="gallery" data-thumb="${img}" href="${img}">
                                    <img src="${img}" class="img-fluid rounded" alt="รูปที่ ${idx+1}">
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-3">
                    <h6 class="text-muted mb-2"><i class="bi bi-globe"></i> Gallery รูป 360 องศา</h6>
                    <div class="row g-2">
                        ${pole.images360.map((img, idx) => `
                            <div class="col-6">
                                <a data-fancybox="gallery360" data-thumb="${img}" href="${img}">
                                    <div class="position-relative">
                                        <img src="${img}" class="img-fluid rounded img360-thumb" alt="360° รูปที่ ${idx+1}">
                                        <div class="position-absolute top-50 start-50 translate-middle">
                                            <i class="bi bi-arrow-clockwise text-white" style="font-size: 2rem; text-shadow: 0 0 10px rgba(0,0,0,0.8);"></i>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        panel.classList.add('active');
    }
    function closePanel() {
        document.getElementById('slidePanel').classList.remove('active');
    }
    function showWindReport(poleId) {
        const windData = {
            1: { speed: 12.5, direction: 'ตะวันออกเฉียงเหนือ', gust: 18.2, temp: 32, humidity: 65 },
            2: { speed: 10.3, direction: 'เหนือ', gust: 15.1, temp: 31, humidity: 68 },
            3: { speed: 15.8, direction: 'ตะวันตก', gust: 22.5, temp: 33, humidity: 62 },
            4: { speed: 9.2, direction: 'ใต้', gust: 13.7, temp: 30, humidity: 70 }
        };
        const data = windData[poleId];
        document.getElementById('windReportContent').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card border-primary">
                        <div class="card-body text-center">
                            <i class="bi bi-wind text-primary" style="font-size: 3rem;"></i>
                            <h3 class="mt-2 mb-0">${data.speed} <small>m/s</small></h3>
                            <p class="text-muted mb-0">ความเร็วลมเฉลี่ย</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <i class="bi bi-hurricane text-warning" style="font-size: 3rem;"></i>
                            <h3 class="mt-2 mb-0">${data.gust} <small>m/s</small></h3>
                            <p class="text-muted mb-0">ความเร็วลมสูงสุด</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <i class="bi bi-compass"></i>
                            <p class="mb-0"><strong>${data.direction}</strong></p>
                            <small class="text-muted">ทิศทางลม</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <i class="bi bi-thermometer-half"></i>
                            <p class="mb-0"><strong>${data.temp}°C</strong></p>
                            <small class="text-muted">อุณหภูมิ</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <i class="bi bi-droplet"></i>
                            <p class="mb-0"><strong>${data.humidity}%</strong></p>
                            <small class="text-muted">ความชื้น</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <i class="bi bi-info-circle"></i> 
                <strong>หมายเหตุ:</strong> ข้อมูลอัพเดทล่าสุดเมื่อ ${new Date().toLocaleString('th-TH')}
            </div>
        `; 
        new bootstrap.Modal(document.getElementById('windReportModal')).show();
    }