import {LINE_1, LINE_1_TERMINUS, LINE_1_LOGO, LINE_1_COLOR} from '../resources/line1.js';
import {LINE_2, LINE_2_TERMINUS, LINE_2_LOGO, LINE_2_COLOR} from '../resources/line2.js';
import {LINE_3, LINE_3_TERMINUS, LINE_3_LOGO, LINE_3_COLOR} from '../resources/line3.js';

const LATITUDE = 47.21342010;
const LONGITUDE = -1.55542978;
var map = null;


//############################################################################################################################//
//  Carte
//############################################################################################################################//

/**
 *  Méthode permettant d'initialiser la carte.
 */
function initMap () {

    map = L.map('map', {
        center: [LATITUDE, LONGITUDE],
        zoom: 17
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
function addMarkers (markers, line, terminus, logo, color) {
    for (let i=0; i<markers.length; i++) {
        var marker = L.circle([markers[i].lat, markers[i].long], {
            color: color,
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 10
        }).addTo(map)
        .on('click', function(e) {
            openSchedule(line, markers[i].code, terminus, logo);
        });
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


//############################################################################################################################//
//  Boîte de dialogue
//############################################################################################################################//

/**
 *  Méthode permettant d'ouvrir une boîte de dialogue.
 */
function openSchedule (line, stop, terminus, logo) {

    document.getElementById("dialog").innerHTML = "<div id=\"schedule\">" + 
            "<p class=\"title\">Choisir une direction :</p>" +
            "<div class=\"terminus\" id=\"terminus1\">" +
                "<div onclick=\"getSchedule('" + line + "', '" + stop + "', 1, '" + terminus[0] + "', '" + logo + "')\">" +
                    "<img class=\"logo\" src=\"images/" + logo + "\" />" +
                    "<p class=\"line\">" + terminus[0] + "</p>" +
                "</div>" +
            "</div>" +
            "<div class=\"terminus\" id=\"terminus1\">" +
                "<div onclick=\"getSchedule('" + line + "', '" + stop + "', 2, '" + terminus[1] + "', '" + logo + "')\">" +
                    "<img class=\"logo\" src=\"images/" + logo + "\" />" +
                    "<p class=\"line\">" + terminus[1] + "</p>" +
                "</div>" +
            "</div>" +
        "</div>";

}


//############################################################################################################################//
//  Main
//############################################################################################################################//

window.onload = function () {

    //  Initialisation de la carte.
    initMap();
    
    //  Ajout des différentes stations.
    addMarkers(LINE_1, "1", LINE_1_TERMINUS, LINE_1_LOGO, LINE_1_COLOR);
    addMarkers(LINE_2, "2", LINE_2_TERMINUS, LINE_2_LOGO, LINE_2_COLOR);
    addMarkers(LINE_3, "3", LINE_3_TERMINUS, LINE_3_LOGO, LINE_3_COLOR);

    //  Ajout des différentes lignes de trams.
    addSegments(LINE_1, LINE_1_COLOR);
    addSegments(LINE_2, LINE_2_COLOR);
    addSegments(LINE_3, LINE_3_COLOR);

};