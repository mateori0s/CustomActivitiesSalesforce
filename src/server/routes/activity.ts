'use strict';
import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { verify } from 'jsonwebtoken';

interface ExecuteLog {
    body: any;
    headers: any;
    trailers: any;
    method: any;
    url: any;
    params: any;
    query: any;
    route: any;
    cookies: any;
    ip: any;
    path: any;
    host: any;
    fresh: any;
    stale: any;
    protocol: any;
    secure: any;
    originalUrl: any;
}
const logExecuteData: ExecuteLog[] = [];
const logData = (req: Request) => {
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
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

const util = require('util');

import axios from 'axios';
interface RequestBody {
    sender: string;
    urgente: 0 | 1;
    validar: 0 | 1;
    bill_number: string;
    source: string;
}
interface InputParamenter {
    cellularNumber?: string;
    bill_number?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

const execute = async function (req: Request, res: Response) {
    const { body } = req;
    const { env: { JWT_SECRET } } = process;

    if (!body) {
        console.error(new Error('invalid jwtdata'));
        return res.status(401).end();
    }
    if (!JWT_SECRET) {
        console.error(new Error('jwtSecret not provided'));
        return res.status(401).end();
    }

    verify(
        body.toString('utf8'),
        JWT_SECRET,
        { algorithms: ['HS256'], complete: false },
        async (err, decoded?: DecodedBody) => {
            if (err) {
                console.error(err);
                return res.status(401).end();
            }
            if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
                const requestBody: Partial<RequestBody> = { sender: 'Claro', urgente: 0, validar: 0 };
                for (const argument of decoded.inArguments) {
                }
                if (
                    !requestBody.bill_number ||
                    !requestBody.source
                ) return res.status(400).send(`Input parameter is missing.`);

                const { env: { BROKER_SMS_API_URL, BROKER_USER_KEY, PRESTA_API_URL } } = process;
                       
                const brokerRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };
        
                const prestaVerificationResponse = await axios.post(
                    `${PRESTA_API_URL}/serviceQualificationManagement/v3/servicequalification`,
                    {
                        description: "Service Qualification 3513856499",
                        externalId: "[TEST]-4f4bb8f57e0b",
                        provideAlternative: true,
                        provideOnlyAvailable: true,
                        provideUnavailabilityReason: true,
                        relatedParty: [{id: "3513856499"}],
                        serviceQualificationItem: [
                            {service: [{serviceCharacteristic: 
                                [{name: "channel",
                                value: "CPAY"}],
                                serviceSpecification: 
                                {id: 0,
                                name: "PRESTA"}}]}
                            ]
                    },
                )
                const messageSendingResponse = await axios.post(
                    `${BROKER_SMS_API_URL}/online_loader/notificacion/cargarnotificacionDn/sms/`,
                    requestBody,
                    { headers: { user_key: BROKER_USER_KEY } },
                )
                    .catch((error) => {
                        brokerRequestDurationTimestamps.end = performance.now();
                        if (error.response) {
                            const { data, status } = error.response;
                            specialConsoleLog(
                                requestBody.bill_number!,
                                'BROKER_REQUEST_FAILED',
                                brokerRequestDurationTimestamps,
                                { data, status }
                            );
                        }
                        const { response: { status, data } } = error;
                        console.log('Error:');
                        console.log(`Status: ${status}`);
                        console.log(`Data: ${JSON.stringify(data)}`);
                    });
                brokerRequestDurationTimestamps.end = performance.now();

                let messageSendingFailed = !messageSendingResponse ? true : false;

                if (!messageSendingFailed && messageSendingResponse && messageSendingResponse.data) {
                    specialConsoleLog(
                        requestBody.bill_number,
                        'BROKER_RESPONSE',
                        brokerRequestDurationTimestamps,
                        messageSendingResponse.data
                    );
                }

                 const output = {
                     brokerStatus: messageSendingFailed ? false :
                         (messageSendingResponse && messageSendingResponse.data ? true : false)
                 };

                specialConsoleLog(requestBody.bill_number, 'BROKER_CA_OUTPUT', { start: null, end: null }, output);

                res.status(200).send(output);
            } else {
                console.error('inArguments invalid.');
                return res.status(400).end();
            }
        },
    );
};

const edit = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Edit');
};

const save = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Save');
};

const publish = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Publish');
};

const validate = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Validate');
};

const stop = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Stop');
};

function millisToMinutesAndSeconds(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

function specialConsoleLog (
    phoneNumber: string,
    eventName: string,
    durationTimestamps: DurationTimestampsPair,
    data: any,
): void {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const { start, end } = durationTimestamps;
    let duration = '-';
    if (start && end) duration = millisToMinutesAndSeconds(end - start);

    const jsonifiedData = JSON.stringify(data);

    console.log(`${todayDate}|${currentTime}|${phoneNumber}|${eventName}|${duration}|${jsonifiedData}`);
}

export default {
    logExecuteData,
    execute,
    edit,
    save,
    publish,
    validate,
    stop,
};
