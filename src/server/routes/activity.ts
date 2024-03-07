'use strict';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import https, { Agent } from "https";
import { Request, Response } from "express";
import { performance } from "perf_hooks";

interface LogExecuteData {
    body: any;
    headers: any;
    trailers: any;
    method: string;
    url: string;
    params: any;
    query: any;
    route: any;
    cookies: any;
    ip: string;
    path: string;
    host: string;
    fresh: boolean;
    stale: boolean;
    protocol: string;
    secure: boolean;
    originalUrl: string;
}

interface DecodedData {
    inArguments?: { cellularNumber?: string }[];
}

interface Token {
    value: string | null;
    expiresAt: Date;
}

export const logExecuteData: LogExecuteData[] = [];

const logData = (req: Request) => { // Log data from the request and put it in an array accessible to the main app.
    logExecuteData.push({
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
        host: req.hostname,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

const JWT = (body: Buffer, secret: string, cb: (err: Error | null, decoded?: DecodedData) => void) => {
    if (!body) return cb(new Error('invalid jwtdata'));
    require('jsonwebtoken').verify(body.toString('utf8'), secret, { algorithm: 'HS256' }, cb);
};

export const execute = (req: Request, res: Response) => {
    JWT(req.body, process.env.JWT_SECRET || '', async (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).end();
        }
        if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
            const { value, expiresAt } = req.app.locals.token as Token;

            let phone = '';
            for (const argument of decoded.inArguments) {
                if (argument.cellularNumber) {
                    phone = argument.cellularNumber;
                    break;
                }
            }

            const now = new Date();

            let balanceValidationFailed = false;

            const httpsAgent = new Agent({ rejectUnauthorized: false });

            if (value === null || expiresAt < now) {
                const { TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD } = process.env;

                // const tokenRequestDurationTimestamps = { start: performance.now(), end: null };
                const tokenRequestDurationTimestamps: {
                    start: number;
                    end: number | null; // Permitir que end sea number o null
                } = { start: 0, end: null };

                const token = await axios({
                    method: 'post',
                    url: TOKEN_API_URL,
                    data: {
                        username: TOKEN_API_USERNAME,
                        password: TOKEN_API_PASSWORD
                    },
                    httpsAgent,
                })
                    .then((res: AxiosResponse) => {
                        if (res.headers.authorization) return res.headers.authorization.substring(7);
                    })
                    .catch((err: AxiosError) => {
                        tokenRequestDurationTimestamps.end = performance.now();
                        if (err.response) {
                            const { data, status } = err.response;
                            const errorData = { data, status, tokenRequestDurationTimestamps };
                            specialConsoleLog(phone, 'TOKEN_REQUEST_ERROR', errorData);
                        }
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
                    API_URL,
                    API_COUNTRY,
                    API_SESSION_ID
                } = process.env;

                const requestBody = {
                    cellularNumber: phone,
                    channel: "PDC"
                };

                const packRenovableApiResponse = await axios({
                    method: 'post',
                    url: API_URL,
                    headers: {
                        Country: API_COUNTRY,
                        'Session-Id': API_SESSION_ID
                    },
                    data: requestBody,
                    httpsAgent,
                })
                    .then((res: AxiosResponse) => {
                        let responseCode, responseMessage, packId, handle;

                        if (res.data.code) {
                            responseCode = res.data.code;
                            responseMessage = res.data.description;
                        } else {
                            responseCode = res.data.responseCode;
                            responseMessage = res.data.responseMessage;
                            packId = res.data.pack?.packId;
                            handle = res.data.handle;
                        }

                        return { responseCode, responseMessage, packId, handle };
                    })
                    .catch((err: AxiosError) => {
                        if (err.response) {
                            const { data, status } = err.response;
                            specialConsoleLog(phone, 'PACK_REQUEST_ERROR', { data, status });
                        }
                        console.log('Error:');
                        console.log(err);
                        return { responseCode: '', responseMessage: '', packId: '', handle: '' };
                    });

            }

            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            // res.end(result);
        } else {
            console.error('inArguments invalid.');
            return res.status(400).end();
        }
    });
};

export const edit = (req: Request, res: Response) => {
    logData(req);
    res.send(200).json('Edit');
};

export const save = (req: Request, res: Response) => {
    logData(req);
    res.send(200).json('Save');
};

export const publish = (req: Request, res: Response) => {
    logData(req);
    res.send(200).json('Publish');
};

export const validate = (req: Request, res: Response) => {
    logData(req);
    res.send(200).json('Validate');
};

export const stop = (req: Request, res: Response) => {
    logData(req);
    res.send(200).json('Stop');
};

function millisToMinutesAndSeconds(millis: number) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

function specialConsoleLog(phoneNumber: string, eventName: string, data: any) {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const jsonifiedData = JSON.stringify(data);

    console.log(`${todayDate}|${currentTime}|${phoneNumber}|${eventName}|${jsonifiedData}`);
}
