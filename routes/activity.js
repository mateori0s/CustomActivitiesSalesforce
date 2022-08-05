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
            let packsType = '';
            let cellularnumber = '';
            let packFinal = '';
            for (const argument of decoded.inArguments) {
                if (argument.packsType) packsType = argument.packsType;
                else if (argument.cellularnumber) cellularnumber = argument.cellularnumber;
                else if (argument.packFinal) packFinal = argument.packFinal;
                if (packsType && cellularnumber && packFinal) break;
            }

            console.log('Getting packs data...');
            console.log('Body:');
            let packsValidationFailed = false;
            let packsValidationError = null;
            const packsValidationResponse = await axios.post(
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
                    return res.data;
                })
                .catch((error) => {
                    console.log('Error:');
                    console.log(error);
                    packsValidationFailed = true;
                    packsValidationError = JSON.stringify(error);
                });

            res.send(200, {
                phoneNumberCanBuyAPack: packsValidationFailed ? false : ((packsValidationResponse.canBePurchased === true && packsValidationResponse.packId) ? true : false),
                packsValidationFailed
            });
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
