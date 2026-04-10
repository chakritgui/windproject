const OPEN_METEO   = 'https://api.open-meteo.com/v1/forecast';
const WIND_REFRESH = 1_800_000;
const MENU_LEVELS = {
    1: { title: 'PROJECT', lang: 'project', endpoint: `${BASE_URL}/api/project.get`, key: 'project_id', label: 'project_name'},
    2: { title: 'WIND MEASUREMENT EQUIPMENT', lang: 'wind_measurement_equipment', endpoint: `${BASE_URL}/api/type.get`, key: 'type_id', label: 'type_name'},
    3: { title: 'INSTALLATION', lang: 'installation', endpoint: `${BASE_URL}/api/installations.get`, key: 'installations_id', label: 'installations_name', isLast: true}
};
const COMPASS_DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
let poleMarkers        = {}; 
let menuState          = {};
let areaVisibility     = {};
let areaLayers         = {};
let areaBounds    = {};
let maskLayer          = null;
let geoDataGlobal      = null;
let labelStyleEl       = null;
let currentPolygonLayer  = null;
let customPickerMarker = null;
let customPicker       = null;
let windOn             = true;
let focusOn            = false;
let windRefreshTimer   = null;
let isRefreshing       = false; 
let animation = true;
let windturbine = false;
let equipment = true;
let DEFAULT_MODE = 'wind';
let satelliteLayer = null;
let allHoles     = [];
let isMaskMode = 'close';
let windSummary = { max: 0, min: 0 };
let show_country_line  = 'hide';
let country_layers_data = null;
let initialBounds = null;
let initialPadding = { padding: [20, 20] };
let maxZoomLevel = 17;
let focusMaskLayer = null;
let countryLayer = [];
let globalWindturbineIcon = null;
let globalPoleIcon = null;
const isMobile = () => window.innerWidth <= 768;
const WINDY_COLORS = [
    { ms: 0,  color: '#dbeafe' },
    { ms: 2,  color: '#3b82f6' },
    { ms: 5,  color: '#22c55e' },
    { ms: 10, color: '#eab308' },
    { ms: 15, color: '#f97316' },
    { ms: 20, color: '#ef4444' },
    { ms: 25, color: '#7e22ce' }
];
const WIND_UNITS = [
    { key: 'ms',   label: 'm/s',  factor: 1 },
    { key: 'kmh',  label: 'km/h', factor: 3.6 },
    { key: 'knot', label: 'kt',   factor: 1.94384 },
];
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));