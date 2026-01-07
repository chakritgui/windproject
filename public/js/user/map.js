const options = {
    key: 'd9f3MF1fFwG9k3A70totUNl2NrghgzXE',
    lat: 18,
    lon: 103,
    zoom: 6
};
let windyAPI;
let windOn = false;
const DEFAULT_LEVEL = '100m';
windyInit(options, api => {
    windyAPI = api;
    const { store } = api;
    store.set('overlay', null);
    document.getElementById('windSwitch').addEventListener('change', e => toggleWind(e.target.checked));
});
function toggleWind(isOn) {
    if (!windyAPI) return;
    windOn = isOn;
    const { store } = windyAPI;
    const status = document.getElementById('windStatus');
    const canvas =
        document.querySelector('.windy-canvas-container') ||
        document.querySelector('#windy canvas');
    if (windOn) {
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        if (canvas) canvas.style.visibility = 'visible';
        status.textContent = 'ON';
    } else {
        if (canvas) canvas.style.visibility = 'hidden';
        status.textContent = 'OFF';
    }
}