'use strict';
const WIND_REFRESH = 1_800_000;
const MENU_LEVELS = {
    1: {
        title:    'PROJECT',
        lang:     'project',
        endpoint: `${BASE_URL}/api/project.get`,
        key:      'project_id',
        label:    'project_name',
    },
    2: {
        title:    'WIND MEASUREMENT EQUIPMENT',
        lang:     'wind_measurement_equipment',
        endpoint: `${BASE_URL}/api/type.get`,
        key:      'type_id',
        label:    'type_name',
    },
    3: {
        title:    'INSTALLATION',
        lang:     'installation',
        endpoint: `${BASE_URL}/api/installations.get`,
        key:      'installations_id',
        label:    'installations_name',
        isLast:   true,
    },
};
const WINDY_COLORS = [
    { ms:  0, color: '#dbeafe' },
    { ms:  2, color: '#3b82f6' },
    { ms:  5, color: '#22c55e' },
    { ms: 10, color: '#eab308' },
    { ms: 15, color: '#f97316' },
    { ms: 20, color: '#ef4444' },
    { ms: 25, color: '#7e22ce' },
];
const WIND_UNITS = [
    { key: 'ms',   label: 'm/s',  factor: 1        },
    { key: 'kmh',  label: 'km/h', factor: 3.6      },
    { key: 'knot', label: 'kt',   factor: 1.94384  },
];
const COMPASS_DIRS = [
    'N','NNE','NE','ENE','E','ESE','SE','SSE',
    'S','SSW','SW','WSW','W','WNW','NW','NNW',
];
const POLE_LABEL = {
    W:          80,
    H:          26,
    POLE_EXCL_R: 28,
};
const OFFSET_DIRS = [
    { dx:  1.00, dy: -0.55 },
    { dx: -1.00, dy: -0.55 },
    { dx:  1.00, dy:  0.55 },
    { dx: -1.00, dy:  0.55 },
    { dx:  0.10, dy: -1.10 },
    { dx:  0.10, dy:  1.10 },
    { dx:  1.40, dy:  0.00 },
    { dx: -1.40, dy:  0.00 },
];
const DEFAULT_MODE  = 'wind';
const maxZoomLevel  = 17;
let poleMarkers       = {};
let turbineMarkers    = {};
let areaLayers        = {};
let areaBounds        = {};
let areaVisibility    = {};
let allHoles          = [];
let countryLayer      = null;
let maskLayer         = null;
let focusMaskLayer    = null;
let satelliteLayer    = null;
let geoDataGlobal       = null;
let country_layers_data = null;
let show_country_line   = 'hide';
let isMaskMode          = false;
let initialBounds       = null;
let initialPadding      = { padding: [20, 20] };
let globalWindturbineIcon = null;
let globalPoleIcon        = null;
let menuState           = {};
let labelStyleEl        = null;
let currentPolygonLayer = null;
let customPickerMarker  = null;
let customPicker        = null;
let windInterval        = null;
let windRefreshTimer    = null;
let windOn      = true;
let focusOn     = false;
let isRefreshing = false;
let animation   = true;
let windturbine = false;
let equipment   = true;
let windSummary = { max: 0, min: 0, avg: 0 };
let currentUnitIdx = (() => {
    const saved = localStorage.getItem('windUnit');
    return saved !== null ? parseInt(saved, 10) : 0;
})();
const clamp    = (val, min, max) => Math.max(min, Math.min(max, val));
const isMobile = () => window.innerWidth <= 768;