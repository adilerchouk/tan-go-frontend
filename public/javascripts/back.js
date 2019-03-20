
//  Modules
const request = require('request');

const TEMPS_ATTENTE = "http://open.tan.fr/ewp/tempsattente.json/";


/**
 *  Méthode permettant de récupérer les données JSON d'une adresse url.
 */
export function httpGet (url) {

    return new Promise (function (resolve) {
        request({
            url: url,
            json: true
        }, function (error, response) {
            console.log(response);
            resolve(response); 
        });
    });
}

/**
 *  Méthode permettant de récupérer les horaires des futurs trams passant à une station.
 */
/*
export function getScheduleFromStop (stop) {

    return new Promise (function (resolve) {
        resolve(httpGet(TEMPS_ATTENTE + stop))
    });
}
*/