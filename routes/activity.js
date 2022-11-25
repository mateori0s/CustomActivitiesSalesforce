'use strict';
const axios = require("axios");
const { performance } = require("perf_hooks");

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
}

const JWT = (body, secret, cb) => {
	if (!body) {
		return cb(new Error('invalid jwtdata'));
	}
	require('jsonwebtoken').verify(body.toString('utf8'), secret, {
		algorithm: 'HS256'
	}, cb);
};

exports.execute = function (req, res) {
    JWT(req.body, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const { BROKER_SMS_API_URL, BROKER_USER_KEY } = process.env;
            const requestBody = { sender: 'Claro', urgente: 0, validar: 0 };
            for (const argument of decoded.inArguments) {
                if (argument.mensajeTraducido) requestBody.mensaje = argument.mensajeTraducido;
                else if (argument.cellularNumber) requestBody.bill_number = argument.cellularNumber;
                else if (argument.remitente) requestBody.source = argument.remitente;
                if (requestBody.bill_number && requestBody.mensaje && requestBody.source) break;
            }

            specialConsoleLog(requestBody.bill_number, 'BROKER_CA_INPUT', {}, decoded);

            const brokerRequestDurationTimestamps = { start: performance.now(), end: null };
            const messageSendingResponse = await axios.post(
                `${BROKER_SMS_API_URL}/online_loader/notificacion/cargarnotificacionDn/sms/`,
                requestBody,
                {
                    headers: {
                        user_key: BROKER_USER_KEY
                    }
                }
            )
                .catch((error) => {
                    brokerRequestDurationTimestamps.end = performance.now();
                    if (error.response) {
                        const { data, status } = error.response;
                        specialConsoleLog(requestBody.bill_number, 'BROKER_REQUEST_FAILED', brokerRequestDurationTimestamps, { data, status });
                    }
                    const { response: { status, data } } = error;
                    console.log('Error:');
                    console.log(`Status: ${status}`);
                    console.log(`Data: ${JSON.stringify(data)}`);
                });
            brokerRequestDurationTimestamps.end = performance.now();

            let messageSendingFailed = !messageSendingResponse ? true : false;

            if (!messageSendingFailed && messageSendingResponse.data) {
                specialConsoleLog(requestBody.bill_number, 'BROKER_RESPONSE', brokerRequestDurationTimestamps, messageSendingResponse.data);
            }

            const output = { brokerStatus: messageSendingFailed ? false : (messageSendingResponse.data ? true : false) };

            specialConsoleLog(requestBody.bill_number, 'BROKER_CA_OUTPUT', {}, output);

            res.send(200, output);
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

function millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

function specialConsoleLog (phoneNumber, eventName, durationTimestamps, data) {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    const { start, end } = durationTimestamps;
    let duration = '-';
    if (start && end) duration = millisToMinutesAndSeconds(end - start);

    const jsonifiedData = JSON.stringify(data);

    console.log(`${todayDate}|${currentTime}|${phoneNumber}|${eventName}|${duration}|${jsonifiedData}`);
}
