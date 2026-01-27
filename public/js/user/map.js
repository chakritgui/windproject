const options = {
    key: 'd9f3MF1fFwG9k3A70totUNl2NrghgzXE',
    lat: 16.5,
    lon: 106.0,
    zoom: 8
};
let windyAPI;
let windOn = true;
let lastPickerLatLng = null;
let poleMarkers = {};
const DEFAULT_LEVEL = '100m';
const isMobile = () => window.innerWidth <= 768;
let menuOpened = false;
windyInit(options, async api => {
    windyAPI = api;
    const { map, store, picker } = api;
    store.set('overlay', 'wind');
    store.set('level', DEFAULT_LEVEL);
    await loadWindAreas(map, picker);
    await loadPoles(map, picker);
    document.getElementById('windSwitch').addEventListener('change', e => {
        toggleWind(e.target.checked);
    });
});
async function loadWindAreas(map, picker) {
    try {
        const areas = await fetchData(`${BASE_URL}/api/wind-area`);
        areas.forEach(area => {
            const rings = JSON.parse(area.geom);
            const latlngs = rings.map(ring => ring.map(p => [p[1], p[0]]));
            const polygon = L.polygon(latlngs, {
                color: area.stroke_color,
                weight: area.stroke_width,
                opacity: area.stroke_opacity,
                fillColor: area.fill_color,
                fillOpacity: area.fill_opacity
            }).addTo(map);
            polygon.on('click', () => {
                const center = polygon.getBounds().getCenter();
                map.flyToBounds(polygon.getBounds(), { padding: [30, 30], maxZoom: 10, duration: 0.8 });
                handlePickerOpening(center, picker);
            });
        });
    } catch (err) { console.error("Error loading areas:", err); }
}
async function loadPoles(map, picker) {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles-location`);
        poles.forEach(pole => {
            const lat = parseFloat(pole.poles_lat);
            const lng = parseFloat(pole.poles_lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                const poleIcon = getDivIcon(pole.type_id);
                const marker = L.marker([lat, lng], { icon: poleIcon }).addTo(map);
                const content = `
                    <div style="min-width: 200px; padding: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="background: #e74c3c; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                                ${pole.type_name || 'Station'}
                            </span>
                            <small style="color: #666; font-weight: 500;">#${pole.poles_code}</small>
                        </div>
                        <h6 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">
                            ${pole.installations_name}
                        </h6>
                        <div style="background: #f8f9fa; border-radius: 6px; padding: 8px; margin-top: 10px; border-left: 3px solid #3498db;">
                            <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 3px;">Coordinates</div>
                            <div style="font-size: 12px; color: #34495e; font-family: monospace;">
                                <i class="fa-solid fa-location-dot"></i> ${pole.poles_lat}, ${pole.poles_lng}
                            </div>
                        </div>
                        <div style="margin-top: 10px; text-align: right;">
                            <button class="open-poles" data-id="${pole.poles_id}" style="background: none; border: 1px solid #3498db; color: #3498db; padding: 3px 10px; border-radius: 4px; cursor: pointer; transition: 0.3s; width: 100%;"><span data-i18n="view_data"></span> <i class="fa-solid fa-arrow-right-from-bracket"></i></button>
                        </div>
                    </div>
                `;
                marker.bindPopup(content);
                poleMarkers[`${lat}_${lng}`] = marker;
                marker.on('click', () => {
                    map.flyTo([lat, lng], 10);
                    handlePickerOpening({ lat, lng }, picker);
                });
            }
        });
    } catch (err) { console.error("Error loading poles:", err); }
}
function goToStation(lat, lng) {
    if (!lat || !lng || !windyAPI) return;
    const { map, picker } = windyAPI;
    const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    map.flyTo([coords.lat, coords.lng], 10, { duration: 1.5 });
    const key = `${coords.lat}_${coords.lng}`;
    if (poleMarkers[key]) {
        poleMarkers[key].openPopup();
    }
    handlePickerOpening(coords, picker);
}
$(document).on('click', '.station-item', function(e) {
    e.stopPropagation();
    goToStation($(this).data('lat'), $(this).data('lng'));
    closeAllMenus();
    menuOpened = false;
});
function getDivIcon(typeId) {
    let color = '#3498db';
    if(typeId == 1) color = '#e74c3c';
    if(typeId == 2) color = '#2ecc71';
    return L.divIcon({
        className: 'custom-pole-icon',
        html: `<i class="fa-solid fa-tower-broadcast" style="color: ${color}; font-size: 18px; text-shadow: 1px 1px 2px #000;"></i>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });
}
async function fetchData(url, bodyData = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });
    return response.json();
}
function handlePickerOpening(latlng, picker) {
    lastPickerLatLng = latlng;
    if (windOn) {
        picker.open({ lat: latlng.lat, lon: latlng.lng || latlng.lon });
    }
}
function toggleWind(isOn) {
    if (!windyAPI) return;
    windOn = isOn;
    const { store, picker } = windyAPI;
    if (windOn) {
        store.set('overlay', 'wind');
        if (lastPickerLatLng) picker.open({ lat: lastPickerLatLng.lat, lon: lastPickerLatLng.lng });
    } else {
        store.set('overlay', 'none');
        picker.close();
    }
}
$('#mapFilter').on('click', async function(e) {
    e.stopPropagation();
    if (menuOpened) return (menuOpened = !closeAllMenus());
    $('#menu1').html('<div class="menu-item" data-i18n="loading">Loading...</div>').show();
    $('#menu2, #menu3').hide();
    try {
        const projects = await fetchData(`${BASE_URL}/api/project`);
        let html = projects.length ? '' : getEmptyStateHTML();
        projects.forEach(p => {
            const isMob = isMobile();
            html += `
                <div class="menu-item ${isMob ? 'project-item' : ''} d-flex align-items-center" 
                     data-id="${p.project_id}" ${isMob ? '' : `onclick="openLevel2(${p.project_id})"`}>
                    <span>${p.project_name}</span>
                    <i class="${isMob ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'} ms-auto"></i>
                </div>
                ${isMob ? `<div class="submenu" id="submenu-${p.project_id}"></div>` : ''}`;
        });
        $('#menu1').html(html);
        menuOpened = true;
    } catch (err) { $('#menu1').html(getEmptyStateHTML('cannot_load')); }
});
$('#menu1').on('click', '.project-item', async function(e) {
    if (!isMobile()) return;
    e.stopPropagation();
    const $submenu = $(this).next('.submenu');
    if ($submenu.is(':visible')) return $submenu.slideUp();
    const types = await fetchData(`${BASE_URL}/api/type`, { project_id: $(this).data('id') });
    let html = types.map(t => `
        <div class="menu-item type-item d-flex" data-project="${$(this).data('id')}" data-type="${t.type_id}">
            ${t.type_name} <i class="fa-solid fa-chevron-down ms-auto"></i>
        </div>
        <div class="submenu"></div>`).join('');
    $submenu.html(html || getEmptyStateHTML()).slideDown();
});
$('#menu1').on('click', '.type-item', async function(e) {
    if (!isMobile()) return;
    e.stopPropagation();
    const $submenu = $(this).next('.submenu');
    if ($submenu.is(':visible')) return $submenu.slideUp();
    const stations = await fetchData(`${BASE_URL}/api/station`, { 
        project_id: $(this).data('project'), 
        type_id: $(this).data('type') 
    });
    let html = stations.map(s => `
        <div class="menu-item station-item" data-lat="${s.poles_lat}" data-lng="${s.poles_lng}">
            ${s.installations_name}
        </div>`).join('');
    $submenu.html(html || getEmptyStateHTML()).slideDown();
});
async function openLevel2(projectId) {
    $(`#menu1 .menu-item`).removeClass('active');
    $(`[data-id="${projectId}"]`).addClass('active');
    $('#menu2').html('<div class="menu-item" data-i18n="loading">Loading...</div>').show();
    $('#menu3').hide();
    const types = await fetchData(`${BASE_URL}/api/type`, { project_id: projectId });
    let html = types.map(t => `
        <div class="menu-item d-flex" data-type="${t.type_id}" onclick="openLevel3(${projectId}, '${t.type_id}')">
            ${t.type_name} <i class="fa-solid fa-chevron-right ms-auto"></i>
        </div>`).join('');
    $('#menu2').html(html || getEmptyStateHTML());
}
async function openLevel3(projectId, typeId) {
    $(`#menu2 .menu-item`).removeClass('active');
    $(`[data-type="${typeId}"]`).addClass('active');
    $('#menu3').html('<div class="menu-item" data-i18n="loading">Loading...</div>').show();
    const stations = await fetchData(`${BASE_URL}/api/station`, { project_id: projectId, type_id: typeId });
    let html = stations.map(s => `
        <div class="menu-item station-item" data-lat="${s.poles_lat}" data-lng="${s.poles_lng}">
            ${s.installations_name}
        </div>`).join('');
    $('#menu3').html(html || getEmptyStateHTML());
}
function closeAllMenus() { $('#menu1, #menu2, #menu3').hide(); return false; }
const getEmptyStateHTML = () => `<div class="menu-item text-center text-white p-2 small" data-i18n="no_data_found">No data</div>`;
$(document).on('click', '.open-poles', async function(e) {
    e.preventDefault();
    let poles_id = $(this).data("id");
    if(!poles_id) return;
    openFilterModal(poles_id, '', '', '');
});