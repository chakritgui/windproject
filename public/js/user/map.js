const options = {
    key: 'd9f3MF1fFwG9k3A70totUNl2NrghgzXE',
    lat: 16.5,
    lon: 106.0,
    zoom: 8
};
let map, windyAPI;
let poleLayerGroup;
let windOn = true;
let lastPickerLatLng = null;
let poleMarkers = {};
let windUpdateFunctions = {};
let menuState = {};
const DEFAULT_LEVEL = '100m';
const isMobile = () => window.innerWidth <= 768;
windyInit(options, async api => {
    windyAPI = api;
    map = api.map;
    const { store, picker } = api;
    poleLayerGroup = L.layerGroup().addTo(map);
    store.set('overlay', 'wind');
    store.set('level', DEFAULT_LEVEL);
    try {
        const results = await Promise.allSettled([
            fetchData(`${BASE_URL}/api/master`),
            fetchData(`${BASE_URL}/api/wind-area`),
            loadPoles(map, picker)
        ]);
        const masterData = results[0].status === 'fulfilled' ? results[0].value : null;
        const windAreaData = results[1].status === 'fulfilled' ? results[1].value : null;
        if (masterData) applyMasterSettings(map, masterData);
        if (windAreaData) await renderWindAreas(map, picker, windAreaData, masterData);
    } catch (error) {
        console.error("Initialization Error:", error);
    } finally {
        hideWindLoading();
    }
    const windSwitch = document.getElementById('windSwitch');
    if (windSwitch) {
        windSwitch.addEventListener('change', e => toggleWind(e.target.checked));
    }
});
function applyMasterSettings(map, master) {
    if (!master?.center_lat || !master?.center_lng) return;
    const lat = parseFloat(master.center_lat);
    const lng = parseFloat(master.center_lng);
    const defaultZoom = Math.min((parseInt(master.zoom_level) || 10) + 1, 13);
    map.setView([lat, lng], defaultZoom);
    map.setMinZoom(defaultZoom);
}
async function renderWindAreas(map, picker, areaData, masterData) {
    const { polygons = [] } = areaData;
    if (polygons.length === 0) return;
    const isMaskMode = masterData?.polygon_visibility === 'open';
    const featureGroup = L.featureGroup();
    const allHoles = [];
    polygons.forEach(area => {
        if (!area.geo_data) return;
        try {
            const geoJsonData = JSON.parse(area.geo_data);
            const styleData = JSON.parse(area.custom_style || "{}");
            const geoLayer = L.geoJSON(geoJsonData, {
                style: () => ({
                    fillColor: styleData.fillColor || "#3388ff",
                    fillOpacity: isMaskMode ? 0 : (styleData.fillOpacity || 0.2),
                    color: styleData.color || "#3388ff",
                    weight: styleData.weight || 2,
                    stroke: !isMaskMode,
                    interactive: true
                })
            });
            geoLayer.on('click', (e) => handlePickerOpening(e.latlng, picker));
            if (area.area_name) geoLayer.bindTooltip(area.area_name, { sticky: true });
            geoLayer.addTo(featureGroup);
            if (isMaskMode) {
                geoLayer.eachLayer(layer => {
                    if (layer.getLatLngs) {
                        const latlngs = layer.getLatLngs();
                        const rings = Array.isArray(latlngs[0]) && !(latlngs[0][0] instanceof L.LatLng) 
                            ? latlngs.map(inner => inner[0]) : [latlngs[0]];
                        allHoles.push(...rings);
                    }
                });
            }
        } catch (e) { console.error("JSON Parse Error (Area):", e); }
    });
    featureGroup.addTo(map);
    if (isMaskMode && allHoles.length > 0) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        L.polygon([world, ...allHoles], {
            fillColor: '#C0C0C0', fillOpacity: 0.8, stroke: false, interactive: false
        }).addTo(map).bringToBack();
    }
    if (featureGroup.getBounds().isValid()) {
        map.setMaxBounds(featureGroup.getBounds().pad(0.3));
        map.options.maxBoundsViscosity = 1.0;
    }
}
async function loadPoles(map, picker) {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles-location`);
        if (!Array.isArray(poles)) return;
        poles.forEach(pole => {
            const lat = parseFloat(pole.poles_lat), lng = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) return;
            const marker = L.marker([lat, lng], { icon: getDivIcon(pole.type_id) }).addTo(poleLayerGroup);
            const windId = `wind-auto-${pole.poles_id}`;
            poleMarkers[pole.poles_id] = marker;
            marker.bindTooltip(
                `<div class="wind-pill">➤<span class="wind-value" id="${windId}">...</span></div>`, 
                { permanent: true, direction: 'right', className: 'wind-custom-tooltip', offset: [5, 0] }
            ).openTooltip();
            const updateWind = async () => {
                const el = document.getElementById(windId);
                if (!el || !windOn) return;
                try {
                    const data = await fetchData('https://api.windy.com/api/point-forecast/v2', {
                        lat, lon: lng, model: "gfs", parameters: ["wind"], levels: ["surface"], key: options.key 
                    });
                    const windSpeed = data['wind-surface']?.[0] || data['wind']?.[0];
                    el.innerText = windSpeed !== undefined ? windSpeed.toFixed(1) : "N/A";
                } catch (e) { el.innerText = "N/A"; }
            };
            windUpdateFunctions[pole.poles_id] = updateWind;
            updateWind();
            setInterval(updateWind, 600000);
            marker.on('click', () => {
                map.flyTo([lat, lng], 10);
                handlePickerOpening({ lat, lng }, picker);
                openPoles(pole.poles_id);
            });
        });
    } catch (err) { console.error("LoadPoles Error:", err); }
}
function toggleWind(isOn) {
    if (!windyAPI) return;
    windOn = isOn;
    const { store } = windyAPI;
    store.set('overlay', windOn ? 'wind' : 'none');
    Object.keys(poleMarkers).forEach(id => {
        const marker = poleMarkers[id];
        windOn ? marker.openTooltip() : marker.closeTooltip();
        if (windOn && windUpdateFunctions[id]) windUpdateFunctions[id]();
    });
}
function handlePickerOpening(latlng, picker) {
    lastPickerLatLng = latlng;
    if (windOn && picker) picker.open({ lat: latlng.lat, lon: latlng.lng || latlng.lon });
}
function getDivIcon(typeId) {
    const color = typeId == 1 ? '#e74c3c' : (typeId == 2 ? '#2ecc71' : '#3498db');
    return L.divIcon({
        className: 'custom-pole-icon',
        html: `<i class="fa-solid fa-tower-broadcast" style="color: ${color}; font-size: 18px; text-shadow: 1px 1px 2px #000;"></i>`,
        iconSize: [24, 24], iconAnchor: [12, 24]
    });
}
async function fetchData(url, bodyData = {}) {
    try {
        const isWindyApi = url.includes('windy.com');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        return await response.json();
    } catch (err) { return {}; }
}
function hideWindLoading() {
    const loader = document.getElementById('wind-loading');
    if (!loader) return;
    loader.style.pointerEvents = 'none';
    loader.style.transition = 'opacity 0.3s ease-out';
    loader.style.opacity = 0;
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
}
const MENU_LEVELS = {
    1: { title: 'MEASUREMENT STATION', endpoint: `${BASE_URL}/api/contracts`, key: 'contract_id', label: 'contract_name' },
    2: { title: 'PROJECT', endpoint: `${BASE_URL}/api/project`, key: 'project_id', label: 'project_name' },
    3: { title: 'POLE TYPE', endpoint: `${BASE_URL}/api/type`, key: 'type_id', label: 'type_name' },
    4: { title: 'INSTALLATION', endpoint: `${BASE_URL}/api/station`, key: 'installations_id', label: 'installations_name', isLast: true }
};
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 4; i++) $(`#menu-level-${i}`).removeClass('active').hide().empty();
    const data = await fetchData(cfg.endpoint, menuState);
    if (!data.length) return;
    let html = `<div class="menu-header">${cfg.title}</div>`;
    data.forEach(item => {
        if (cfg.isLast) {
            html += `<div class="menu-item station-item" onclick="handleStationClick(${item.poles_lat}, ${item.poles_lng}, ${item.poles_id}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-location-dot text-info"></i></div>`;
        } else {
            html += `<div class="menu-item" onclick="selectItem(${level}, ${item[cfg.key]}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-chevron-right"></i></div>`;
        }
    });
    const panel = $(`#menu-level-${level}`);
    panel.html(html).addClass('active').fadeIn();
    if (isMobile()) panel[0].scrollIntoView({ behavior: 'smooth' });
}
function selectItem(level, id, el) {
    $(el).addClass('selected').siblings().removeClass('selected');
    menuState[MENU_LEVELS[level].key] = id;
    loadMenuLevel(level + 1);
}
function handleStationClick(lat, lng, id, el) {
    if (isNaN(lat) || isNaN(lng)) return;
    $('.station-item').removeClass('selected');
    $(el).addClass('selected');
    map.flyTo([lat, lng], 10, { duration: 1.2 });
    if (windyAPI && windyAPI.picker) {
        handlePickerOpening({ lat, lng }, windyAPI.picker);
    }
    $('.menu-panel').fadeOut();
    openPoles(id);
}
$('#mapFilter').on('click', function (e) {
    e.stopPropagation();
    const firstPanel = $('#menu-level-1');
    if (firstPanel.is(':visible')) {
        $('.menu-panel').fadeOut();
    } else {
        menuState = {};
        loadMenuLevel(1);
    }
});
$(document).on('click', function () { $('.menu-panel').fadeOut(); });
$('.menu-panel').on('click', e => e.stopPropagation());
function openPoles(poleId) { openFilterModal(poleId); }