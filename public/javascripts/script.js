import {LINE_1, LINE_1_COLOR} from '../resources/line1.js';
import {LINE_2, LINE_2_COLOR} from '../resources/line2.js';
import {LINE_3, LINE_3_COLOR} from '../resources/line3.js';

const latitude = 47.21342010;
const longitude = -1.55542978;
var map = null;

/*/
var icon = L.icon({
    iconUrl: "./svg/Tram_L3.svg",
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [-3, -76],
});
*/


/**
 *  Méthode permettant d'initialiser la carte.
 */
function initMap () {

    map = L.map('map', {
        center: [latitude, longitude],
        zoom: 16
    });
    
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        id: 'mapbox.light',
        minZoom: 0,
        maxZoom: 20
    }).addTo(map);

}

/**
 *  Méthode permettant d'ajouter différents markers sur la carte.
 */
function addMarkers (markers, color) {
    for (let i=0; i<markers.length; i++) {
        var marker = L.circle([markers[i].lat, markers[i].long], {
            color: color,
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 10
        }).addTo(map);
        marker.bindPopup(markers[i].code);
    }
}

/**
 *  Méthode permettant d'ajouter différents segments sur la carte.
 */
function addSegments (markers, color) {
    for (let i=1; i<markers.length; i++) {
        var polygon = L.polygon([
            [markers[i-1].lat, markers[i-1].long],
            [markers[i].lat, markers[i].long]
        ],{
            color: color,
            radius: 10
        }).addTo(map);
    }
}

/**
 *  Méthode permettant de réaliser le déplacement d'un marker le long d'un trajet.
 */
function moveMarker (t, stops) {

    const n = stops.length;

    for (let i=0; i<n-1; i++) {
        setTimeout(function () {
            moveMarkerBetweenTwoStops(t/n, stops[i], stops[i+1]);
        }, i*t/n);
    }

}

/**
 *  Méthode permettant de réaliser le déplacement d'un marker entre deux arrêts.
 */
function moveMarkerBetweenTwoStops (t, origin, destination) {

    const d = 50;

    const n = t/d;
    const x = (destination.lat - origin.lat) / n;
    const y = (destination.long - origin.long) / n;

    var circle = null;

    circle = L.circle([origin.lat, origin.long], {
        color: "black",
        fillOpacity: 0.5,
        radius: 10
    }).addTo(map);

    for (let i=1; i<n; i++) {
        setTimeout(function () {

            if (circle != undefined) {
                map.removeLayer(circle);
            }

            circle = L.marker([origin.lat + i*x, origin.long + i*y], {
                color: "black",
                fillOpacity: 0.5,
                radius: 10,
                //icon: icon
            }).addTo(map);

        }, i*d);
    }

    setTimeout(function () {
        if (circle != undefined) {
            map.removeLayer(circle);
        }
    }, n*d);

}

/**
 *  Méthode permettant de récupérer les différents horaires d'un tram pour un arrêt particulier.
 */
function getScheduleFromStop (stop) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/schedule');
    xhr.send('stop=' + stop);
}


/**
 *  Méthode principale.
 */
window.onload = function () {

    initMap();
    
    //  Ajout des différentes stations.
    addMarkers(LINE_1, LINE_1_COLOR);
    addMarkers(LINE_2, LINE_2_COLOR);
    addMarkers(LINE_3, LINE_3_COLOR);

    //  Ajout des lignes de trams.
    addSegments(LINE_1, LINE_1_COLOR);
    addSegments(LINE_2, LINE_2_COLOR);
    addSegments(LINE_3, LINE_3_COLOR);

    //getScheduleFromStop("CRQU");

    //httpGet("http://open_preprod.tan.fr/ewp/arrets.json");

    moveMarker(50000, LINE_2);

    /*
    moveMarker(20000,
        { code: 'OTAG', lat: 47.21990598, long: -1.55512076 },
        { code: 'CRQU', lat: 47.21696856, long: -1.55675776 });
        */
};