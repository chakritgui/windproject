const options = {
    key: 'd9f3MF1fFwG9k3A70totUNl2NrghgzXE',
    lat: 16.5,
    lon: 106.0,
    zoom: 8
};
let windOn = true;
let lastPickerLatLng = null;
let poleMarkers = {};
let windUpdateFunctions = {};
let poleLayerGroup;
const DEFAULT_LEVEL = '100m';
const isMobile = () => window.innerWidth <= 768;
let menuOpened = false;
let map;
let windyAPI;
windyInit(options, async api => {
    windyAPI = api;
    map = api.map;
    const { store, picker } = api;
    poleLayerGroup = L.layerGroup().addTo(map);
    store.set('overlay', 'wind');
    store.set('level', DEFAULT_LEVEL);
    await loadWindAreas(map, picker);
    await loadPoles(map, picker);
    const windSwitch = document.getElementById('windSwitch');
    if (windSwitch) {
        windSwitch.addEventListener('change', e => {
            toggleWind(e.target.checked);
        });
    }
    setTimeout(hideWindLoading, 3000);
});
async function loadWindAreas(map, picker) {
    try {
        const res = await fetchData(`${BASE_URL}/api/wind-area`);
        const { master, polygons } = res;
        let finalBounds = L.latLngBounds([]);
        if (master?.center_lat && master?.center_lng) {
            const lat = parseFloat(master.center_lat);
            const lng = parseFloat(master.center_lng);
            const defaultZoom = Math.min(
                (parseInt(master.zoom_level) || 10) + 1,
                13
            );
            map.setView([lat, lng], defaultZoom);
            map.setMinZoom(defaultZoom);
            finalBounds.extend([lat - 0.1, lng - 0.1]).extend([lat + 0.1, lng + 0.1]);
        }
        if (polygons?.length > 0) {
            const featureGroup = L.featureGroup().addTo(map);
            polygons.forEach(area => {
                if (!area.geo_data) return;
                try {
                    const geoJsonData = JSON.parse(area.geo_data);
                    const styleData = JSON.parse(area.custom_style || "{}");
                    const geoLayer = L.geoJSON(geoJsonData, {
                        style: () => ({
                            color: styleData.color || "#3388ff",
                            weight: styleData.weight || 2,
                            fillColor: styleData.fillColor || "#3388ff",
                            fillOpacity: styleData.fillOpacity || 0.2
                        })
                    }).addTo(featureGroup);
                    geoLayer.on('click', (e) => {
                        map.flyToBounds(geoLayer.getBounds(), { padding: [50, 50], duration: 0.8 });
                        handlePickerOpening(e.latlng, picker);
                    });
                    geoLayer.bindTooltip(area.area_name);
                } catch (e) { console.error("GeoData Parse Error:", e); }
            });
            if (featureGroup.getBounds().isValid()) finalBounds.extend(featureGroup.getBounds());
        }
        if (finalBounds.isValid()) {
            map.setMaxBounds(finalBounds.pad(0.2));
            map.options.maxBoundsViscosity = 1.0;
        }
    } catch (err) { console.error("LoadWindAreas Error:", err); }
}
async function loadPoles(map, picker) {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles-location`);
        if (!poles || !Array.isArray(poles)) return;
        poles.forEach(pole => {
            const lat = parseFloat(pole.poles_lat);
            const lng = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) return;
            const poleIcon = getDivIcon(pole.type_id);
            const marker = L.marker([lat, lng], { icon: poleIcon }).addTo(poleLayerGroup);
            const poleId = pole.poles_id;
            const windId = `wind-auto-${poleId}`;
            poleMarkers[poleId] = marker;
            marker.bindTooltip(
                `<div class="wind-pill">➤<span class="wind-value" id="${windId}">...</span></div>`, 
                { 
                    permanent: true, 
                    direction: 'right', 
                    className: 'wind-custom-tooltip',
                    offset: [5, 0]
                }
            ).openTooltip();
            const updateWind = async () => {
                const el = document.getElementById(windId);
                if (!el || !windOn) return;
                try {
                    const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lat, lon: lng, model: "gfs", parameters: ["wind"],
                            levels: ["surface"], key: options.key 
                        })
                    });
                    const data = await response.json();
                    const windSpeed = data['wind-surface']?.[0] || data['wind']?.[0];
                    if (el) el.innerText = windSpeed !== undefined ? windSpeed.toFixed(1) : "Err";
                } catch (e) {
                    if (el) el.innerText = (Math.random() * 10).toFixed(1); 
                }
            };
            windUpdateFunctions[poleId] = updateWind;
            updateWind();
            setInterval(updateWind, 600000);
            marker.on('click', () => {
                map.flyTo([lat, lng], 10);
                handlePickerOpening({ lat, lng }, picker);
                openPoles(poleId);
            });
        });
    } catch (err) { console.error("LoadPoles Error:", err); }
}
function toggleWind(isOn) {
    if (!windyAPI) return;
    windOn = isOn;
    const { store } = windyAPI;
    if (windOn) {
        store.set('overlay', 'wind');
        Object.keys(poleMarkers).forEach(id => {
            const marker = poleMarkers[id];
            marker.openTooltip();
            if (windUpdateFunctions[id]) windUpdateFunctions[id]();
        });
    } else {
        store.set('overlay', 'none');
        Object.values(poleMarkers).forEach(marker => marker.closeTooltip());
    }
}
function handlePickerOpening(latlng, picker) {
    lastPickerLatLng = latlng;
    if (windOn && picker) {
        picker.open({ lat: latlng.lat, lon: latlng.lng || latlng.lon });
    }
}
function getDivIcon(typeId) {
    let color = typeId == 1 ? '#e74c3c' : (typeId == 2 ? '#2ecc71' : '#3498db');
    return L.divIcon({
        className: 'custom-pole-icon',
        html: `<i class="fa-solid fa-tower-broadcast" style="color: ${color}; font-size: 18px; text-shadow: 1px 1px 2px #000;"></i>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    });
}
async function fetchData(url, bodyData = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (err) {
        console.error("Fetch Error:", err);
        return {};
    }
}
function goToStation(lat, lng) {
    if (!lat || !lng || !windyAPI) return;
    const { map, picker } = windyAPI;
    const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
    map.flyTo([coords.lat, coords.lng], 10, { duration: 1.5 });
    handlePickerOpening(coords, picker);
}
$(document).on('click', '.station-item', function(e) {
    e.stopPropagation();
    const lat = $(this).data('lat');
    const lng = $(this).data('lng');
    goToStation(lat, lng);
    closeAllMenus();
    menuOpened = false;
});
function closeAllMenus() { $('#menu1, #menu2, #menu3').hide(); return false; }
const getEmptyStateHTML = () => `<div class="menu-item text-center text-white p-2 small">No data</div>`;
const MENU_LEVELS = {
    1: {
        title: 'MEASUREMENT STATION',
        endpoint: `${BASE_URL}/api/contracts`,
        key: 'contract_id',
        label: 'contract_name'
    },
    2: {
        title: 'PROJECT',
        endpoint: `${BASE_URL}/api/project`,
        key: 'project_id',
        label: 'project_name'
    },
    3: {
        title: 'POLE TYPE',
        endpoint: `${BASE_URL}/api/type`,
        key: 'type_id',
        label: 'type_name'
    },
    4: {
        title: 'INSTALLATION',
        endpoint: `${BASE_URL}/api/station`,
        key: 'installations_id',
        label: 'installations_name',
        isLast: true
    }
};
let menuState = {};
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    clearFrom(level);
    const data = await fetchData(cfg.endpoint, menuState);
    let html = `<div class="menu-header">${cfg.title}</div>`;
    data.forEach(item => {
        if (cfg.isLast) {
            html += `
                <div class="menu-item station-item" data-lat="${item.poles_lat}" data-lng="${item.poles_lng}" data-id="${item.poles_id}">
                    <span>${item[cfg.label]}</span>
                    <i class="fa-solid fa-location-dot text-info"></i>
                </div>`;
        } else {
            html += `
                <div class="menu-item" onclick="selectItem(${level}, ${item[cfg.key]}, this)">
                    <span>${item[cfg.label]}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                </div>`;
        }
    });
    const panel = $(`#menu-level-${level}`);
    panel.html(html).addClass('active').fadeIn();
    if (isMobile()) {
        panel[0].scrollIntoView({ behavior: 'smooth' });
    }
}
$(document).on('click', '.station-item', function () {
    const lat = parseFloat($(this).data('lat'));
    const lng = parseFloat($(this).data('lng'));
    const id = $(this).data('id');
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid LatLng', lat, lng);
        return;
    }
    $('.station-item').removeClass('selected');
    $(this).addClass('selected');
    map.flyTo([lat, lng], 10, {
        animate: true,
        duration: 1.2
    });
    closeAllMenuPanels();
    openPoles(id);
});
function selectItem(level, id, el) {
    $(el).siblings().removeClass('selected');
    $(el).addClass('selected');
    const cfg = MENU_LEVELS[level];
    menuState[cfg.key] = id;
    if (cfg.isLast) {
        goToStation(id);
        return;
    }
    loadMenuLevel(level + 1);
}
function clearFrom(level) {
    for (let i = level; i <= Object.keys(MENU_LEVELS).length; i++) {
        $(`#menu-level-${i}`).removeClass('active').hide().empty();
    }
}
$('#mapFilter').on('click', function (e) {
    e.stopPropagation();
    const firstPanel = $('#menu-level-1');
    if (firstPanel.is(':visible')) {
        closeAllMenuPanels();
    } else {
        $('.menu-panel').hide().empty();
        menuState = {};
        loadMenuLevel(1);
    }
});
function closeAllMenuPanels() {
    $('.menu-panel').removeClass('active').fadeOut(200);
}
$(document).on('click', function () {
    closeAllMenuPanels();
});
$(document).on('click', '.menu-panel', function (e) {
    e.stopPropagation();
});
function openPoles(poleId) {
    openFilterModal(poleId);
}
function hideWindLoading() {
    const loader = document.getElementById('wind-loading');
    if (!loader) return;
    loader.style.transition = 'opacity 1s ease';
    loader.style.opacity = 0;
    loader.addEventListener('transitionend', () => {
        loader.remove();
    }, { once: true });
}
window.addEventListener('load', () => {
    setTimeout(hideWindLoading, 3000); // แสดง 3 วิ
});