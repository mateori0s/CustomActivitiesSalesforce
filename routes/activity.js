'use strict';
const util = require('util');
const axios = require("axios");
const https = require("https");

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

exports.execute = (req, res) => {
    console.log(JSON.stringify(req.headers));
    JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            console.log('##### decoded ####=>', decoded);

            const { value, expiresAt } = req.app.locals.token;

            const now = new Date();
        
            let accountBalance = 0.0;
            let balanceValidationFailed = false;
        
            const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        
            if (value === null || expiresAt < now) {
                const { tokenApiUrl, tokenApiUsername, tokenApiPassword } = process.env;
        
                console.log('GETTING TOKEN...');
                const token = await axios({
                    method: 'post',
                    url: tokenApiUrl,
                    data: {
                        username: tokenApiUsername,
                        password: tokenApiPassword
                    },
                    httpsAgent,
                })
                    .then((res) => {
                        console.log('Token obtained.');
                        if (res.headers.authorization) return res.headers.authorization.substring(7);
                    })
                    .catch((err) => {
                        console.log('Error:');
                        console.log(err);
                    });
                if (!token) balanceValidationFailed = true;
                else {
                    req.app.locals.token = {
                        value: token,
                        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
                    };
                }
            }
        
            if (!balanceValidationFailed) {
                const {
                    balancesApiUrl,
                    balancesApiSessionId,
                    balancesApiChannel,
                    balancesApiService
                } = process.env;
        
                let phone = '';
                for (const argument of decoded.inArguments) {
                    if (argument.phone) {
                        phone = argument.phone;
                        break;
                    }
                }
        
                console.log('Getting balance data...');
                const saldoBalancesApiResponse = await axios({
                    method: 'get',
                    url: balancesApiUrl,
                    headers: {
                        Authorization: `Bearer ${req.app.locals.token.value}`,
                        'Session-Id': balancesApiSessionId,
                        Channel: balancesApiChannel,
                        Service: balancesApiService,
                        SubId: `549${phone}`,
                    },
                    httpsAgent,
                })
                    .then((res) => {
                        console.log('Response');
                        console.log(res.data);
                        return res.data;
                    })
                    .catch((err) => {
                        console.log('Error:');
                        console.log(err);
                    });
                if (!saldoBalancesApiResponse) balanceValidationFailed = true;
                else accountBalance = saldoBalancesApiResponse.balancesDetails.accountBalance;
            }
        
            res.send(200, {
                accountBalance,
                balanceValidationFailed,
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
