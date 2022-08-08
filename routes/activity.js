'use strict';
const util = require('util');
const axios = require("axios");

exports.logExecuteData = [];
const logData = (req) => { // Log data from the request and put it in an array accessible to the main app.
    exports.logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
    console.log("body: " + util.inspect(req.body));
    console.log("headers: " + req.headers);
    console.log("trailers: " + req.trailers);
    console.log("method: " + req.method);
    console.log("url: " + req.url);
    console.log("params: " + util.inspect(req.params));
    console.log("query: " + util.inspect(req.query));
    console.log("route: " + req.route);
    console.log("cookies: " + req.cookies);
    console.log("ip: " + req.ip);
    console.log("path: " + req.path);
    console.log("host: " + req.host);
    console.log("fresh: " + req.fresh);
    console.log("stale: " + req.stale);
    console.log("protocol: " + req.protocol);
    console.log("secure: " + req.secure);
    console.log("originalUrl: " + req.originalUrl);
}

const JWT = (body, secret, cb) => {
	if (!body) return cb(new Error('invalid jwtdata'));
	require('jsonwebtoken').verify(body.toString('utf8'), secret, { algorithm: 'HS256' }, cb);
};

exports.execute = function (req, res) {
    console.log(JSON.stringify(req.headers));
    JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            console.log('##### decoded ####=>', decoded);

            const { claroOffersApiUrl, claroOffersApiSessionId } = process.env;

            let cellularnumber = null;
            let packFinal = null;
            let packPrice = null;
            let packMsj = null;
            for (const argument of decoded.inArguments) {
                if (argument.cellularnumber) cellularnumber = argument.cellularnumber;
                else if (argument.packFinal) packFinal = argument.packFinal;
                else if (argument.packPrice) packPrice = argument.packPrice;
                else if (argument.packMsj) packMsj = argument.packMsj;
                if (cellularnumber && packFinal && packPrice && packMsj) break;
            }

            console.log('Getting packs data...');
            let packsValidationFailed = false;
            const pack = await axios.post(
                claroOffersApiUrl,
                {
                    billNumber: Number(cellularnumber),
                    channel: "PDC"
                },
                {
                    headers: {
                        Country: 'AR',
                        'Session-Id': claroOffersApiSessionId
                    }
                }
            )
                .then((res) => {
                    console.log('Response:');
                    console.log(res.data);

                    let packFound = null;
                    for (const service of res.data.offerServices) {
                        for (const pack of service.offerPacks) {
                            if (pack.packId === packFinal && pack.canBePurchased === true) {
                                packFound = pack;
                                break;
                            }
                        }
                        if (packFound !== null) break;
                    }

                    return packFound;
                })
                .catch((error) => {
                    console.log('Error:');
                    console.log(error);
                    packsValidationFailed = true;
                    return null;
                });

            let messageToSend = '';

            if (pack && !packsValidationFailed) {
                const { unitsTime, initialVolume, initialUnit, volumeTime } = pack.detail;

                let unitsTimeWord = null;
                switch (unitsTime) {
                   case 'hora':
                      unitsTimeWord = { singular: 'hora', plural: 'horas' };
                      break;
                   case 'dia':
                      unitsTimeWord = { singular: 'día', plural: 'días' };
                      break;
                   case 'mes':
                      unitsTimeWord = { singular: 'mes', plural: 'meses' };
                      break;
                   default:
                      break;
                }

                let packPriceText = String(packPrice).replace('.', ',');
                if (getNumberFloatingScale(packPrice) === 1) packPriceText += '0';

                messageToSend = packMsj
                    .trim()
                    .replace('#C#', `${initialVolume}${initialUnit}`)
                    .replace('#V#', `${volumeTime} ${volumeTime === 1 ? unitsTimeWord.singular : unitsTimeWord.plural}`)
                    .replace('#P#', packPriceText);
            }

            const response = {
                phoneNumberCanBuyAPack: pack === null ? false : true,
                messageToSend,
                packsValidationFailed
            };
            console.log('##### response ####=>', response);
            res.send(200, response);
        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
};

exports.edit = (req, res) => {
    logData(req);
    res.send(200, 'Edit');
};

exports.save = (req, res) => {
    logData(req);
    res.send(200, 'Save');
};

exports.publish = (req, res) => {
    logData(req);
    res.send(200, 'Publish');
};

exports.validate = (req, res) => {
    logData(req);
    res.send(200, 'Validate');
};

exports.stop = (req, res) => {
    logData(req);
    res.send(200, 'Stop');
};

const getNumberFloatingScale = (number) => {
    const stringifiedNumber = String(number);
    const floatingPointIndex = stringifiedNumber.indexOf('.');
    if (floatingPointIndex === -1) return 0;
    return stringifiedNumber.substring(floatingPointIndex + 1).length;
};
