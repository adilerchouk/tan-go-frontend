import {LINE_1, LINE_1_TERMINUS, LINE_1_LOGO, LINE_1_COLOR} from '../resources/line1.js';
import {LINE_2, LINE_2_TERMINUS, LINE_2_LOGO, LINE_2_COLOR} from '../resources/line2.js';
import {LINE_3, LINE_3_TERMINUS, LINE_3_LOGO, LINE_3_COLOR} from '../resources/line3.js';

const LATITUDE = 47.21342010;
const LONGITUDE = -1.55542978;
const MAX_TRAMAYS = 3;
const TRAM_SPEED = 15000 / 60;
const DELTA = 100;
const TIME_STOP = 20000;

var map = null;


//############################################################################################################################//
//  Carte
//############################################################################################################################//

/**
 *  Méthode permettant d'initialiser la carte.
git  */
function initMap () {

    map = L.map('map', {
        center: [LATITUDE, LONGITUDE],
        zoom: 14
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
        //marker.bindPopup(markers[i].code);
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
 *  Méthode permettant de déplacer un marqueur entre deux points.
 */
function moveMarker (stops, direction, origin, destination, duration) {

    const n = duration / DELTA;
    const x = (destination.lat - origin.lat) / n;
    const y = (destination.long - origin.long) / n;

    var circle = null;

    circle = L.circle([origin.lat, origin.long], {
        color: "black",
        fillOpacity: 0.5,
        radius: 12
    }).addTo(map);

    for (let i=1; i<n; i++) {
        setTimeout(function () {

            if (circle != undefined) {
                map.removeLayer(circle);
            }

            circle = L.circle([origin.lat + i*x, origin.long + i*y], {
                color: "black",
                fillOpacity: 0.5,
                radius: 12,
            }).addTo(map);

        }, i*DELTA);
    }

    setTimeout(function () {
        map.removeLayer(circle);
        followTramay (stops, direction, destination);
    }, n*DELTA + TIME_STOP);
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
                "<div onclick=\"getSchedule('" + line + "', '" + stop + "', 1, '" + terminus[1] + "', '" + logo + "')\">" +
                    "<img class=\"logo\" src=\"images/" + logo + "\" />" +
                    "<p class=\"line\">" + terminus[1] + "</p>" +
                "</div>" +
            "</div>" +
            "<div class=\"terminus\" id=\"terminus1\">" +
                "<div onclick=\"getSchedule('" + line + "', '" + stop + "', 2, '" + terminus[0] + "', '" + logo + "')\">" +
                    "<img class=\"logo\" src=\"images/" + logo + "\" />" +
                    "<p class=\"line\">" + terminus[0] + "</p>" +
                "</div>" +
            "</div>" +
        "</div>";

}


//############################################################################################################################//
//  Tramay
//############################################################################################################################//

/**
 *  Méthode permettant de récupérer les différents horaires d'un tram
 *      pour un arrêt particulier
 *      dans une direction particulière
 */
function getScheduleFromStop (line, stop, direction) {

    return new Promise (function(resolve, reject) {

        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/schedule/' + stop);
        xhr.send(null);

        xhr.addEventListener('readystatechange', function () {
            let json = JSON.parse(xhr.response);
            let schedule = [];

            let k = 0;
            for (let i=0; i<json.body.length; i++) {

                let station = json.body[i];
                
                if (station.ligne.numLigne === line && station.sens === direction) {
                    schedule.push(station.temps);
                    k++;

                    if (k === MAX_TRAMAYS) { break; }
                }
            }

            resolve (schedule);
        });
    });
}


/**
 *  Méthode permettant d'ajouter les trams se trouvant sur une ligne.
 */
function addTramaysForLine (line, stops) {
    
    for (let i=1; i<stops.length; i++) {
        addTramaysBetweenTwoStops(line, stops, stops[i-1], stops[i], 1);
        addTramaysBetweenTwoStops(line, stops, stops[i], stops[i-1], 2);
    }
}

/**
 *  Méthode permettant d'ajouter les trams se trouvant entre deux arrêts.
 */
async function addTramaysBetweenTwoStops (line, stops, stop1, stop2, direction) {
    
    let info = getDistanceAndTime (stop1, stop2);
    let schedule = await getScheduleFromStop (line, stop2.code, direction);
   
    for (let i=0; i<schedule.length; i++) {
        
        let waitingTime = smartTime (schedule[i]);

        //  Si celui-ci est plus court que le temps théorique, le tram se trouve sur le segment.
        if (waitingTime < info.time) {
            addTramay (line, stops, direction, stop1, stop2, info.distance, info.time, waitingTime);
        }
    }
}

/**
 *  Méthode permettant de récupérer le temps d'attente au bon format.
 */
function smartTime (time) {
    
    if (time === "horaire.proche" || time === "Proche") { return 0.5; }

    let a = time.split(" ");
    if (a.length == 2) { return parseInt(a[0]); }
    if (a.length == 3) { return parseInt(a[0]) + parseInt(a[2])/60; }

}

/**
 *  Méthode permettant de calculer la distance et le temps séparant 2 stations
 *      en fonction de leur latitude et longitude.
 */
function getDistanceAndTime (stop1, stop2) {

    let lat1 = stop1.lat.toString().parseDeg(), lon1 = stop1.long.toString().parseDeg();
    let lat2 = stop2.lat.toString().parseDeg(), lon2 = stop2.long.toString().parseDeg();
    let a = 6378137, b = 6356752.3142, f = 1/298.257223563;
    let L = (lon2-lon1) * Math.PI / 180;
    let U1 = Math.atan((1-f) * Math.tan(lat1 * Math.PI / 180));
    let U2 = Math.atan((1-f) * Math.tan(lat2 * Math.PI / 180));
    let sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    let sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
    
    let lambda = L, lambdaP, iterLimit = 100;

    do {
        var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
        var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) + 
        (cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));

        if (sinSigma==0) return 0;

        var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
        var sigma = Math.atan2(sinSigma, cosSigma);
        var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
        var cosSqAlpha = 1 - sinAlpha*sinAlpha;
        var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;

        if (isNaN(cos2SigmaM)) cos2SigmaM = 0;

        let C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1-C) * f * sinAlpha *
        (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));

    } while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0);

    if (iterLimit==0) return NaN
  
    let uSq = cosSqAlpha * (a*a - b*b) / (b*b);
    let A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
    let B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
    let deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
      B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
    let s = b*A*(sigma-deltaSigma);
    
    let distance = s.toFixed(3);

    return { stop1: stop1.code, stop2: stop2.code, distance: distance, time: distance / TRAM_SPEED };
}

/**
 *  Méthode permettant de parser les latitudes et longitudes.
 */
String.prototype.parseDeg = function () {

    if (!isNaN(this)) return Number(this);
  
    let degLL = this.replace(/^-/,'').replace(/[NSEW]/i,'');
    let dms = degLL.split(/[^0-9.]+/);

    for (let i in dms) if (dms[i]=='') dms.splice(i,1);   
    switch (dms.length) {                                 
      case 3:                                         
        var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; break;
      case 2:                                              
        var deg = dms[0]/1 + dms[1]/60; break;
      case 1:
        if (/[NS]/i.test(this)) degLL = '0' + degLL;       
        var deg = dms[0].slice(0,3)/1 + dms[0].slice(3,5)/60 + dms[0].slice(5)/3600; break;
      default: return NaN;
    }
    if (/^-/.test(this) || /[WS]/i.test(this)) deg = -deg;
    return deg;
  }  
  

/**
 *  Méthode permettant de placer un tram sur un segment.
 */
function addTramay (line, stops, direction, stop1, stop2, distance, theoreticalDuration, waitingTime) {

    let d = distance * waitingTime / theoreticalDuration;
    let x = stop2.lat - (stop2.lat - stop1.lat) * d / distance;
    let y = stop2.long - (stop2.long - stop1.long) * d / distance;

    moveMarker (stops, direction, { lat: x, long: y}, stop2, waitingTime * 60 * 1000);
}

/**
 *  Méthode permettant de récupérer la station suivante d'un tram.
 */
function getNextStop (stops, stop1, direction) {

    for (let i=0; i<stops.length; i++) {
        if (stops[i].code === stop1.code) {
            if (direction == 1 && i != stops.length-1) {
                return stops[i+1];
            }
            if (direction == 2 && i != 0) {
                return stops[i-1];
            }
        }
    }

    return null;
}

/**
 *  Méthode permettant de suivre un tram.
 */
function followTramay (stops, direction, stop1) {

    let nextStop = getNextStop (stops, stop1, direction);
    if (nextStop != null) {
        let info = getDistanceAndTime (stop1, nextStop);
        moveMarker (stops, direction, stop1, nextStop, info.time * 60 * 1000);
    }
}



//############################################################################################################################//
//  Main
//############################################################################################################################//

window.onload = function () {

    //  Initialisation de la carte.
    initMap();
    
    //  Ajout des différentes stations.
    addMarkers (LINE_1, "1", LINE_1_TERMINUS, LINE_1_LOGO, LINE_1_COLOR);
    addMarkers (LINE_2, "2", LINE_2_TERMINUS, LINE_2_LOGO, LINE_2_COLOR);
    addMarkers (LINE_3, "3", LINE_3_TERMINUS, LINE_3_LOGO, LINE_3_COLOR);

    //  Ajout des différentes lignes de trams.
    addSegments (LINE_1, LINE_1_COLOR);
    addSegments (LINE_2, LINE_2_COLOR);
    addSegments (LINE_3, LINE_3_COLOR);

    //  Ajout des différents tramays.
    addTramaysForLine ("1", LINE_1);
    addTramaysForLine ("2", LINE_2);
    addTramaysForLine ("3", LINE_3);

};