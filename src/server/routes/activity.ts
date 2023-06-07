'use strict';
import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { verify } from 'jsonwebtoken';
import https from 'https';
import axios from 'axios';

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
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

interface InputParamenter {
    packsType?: string;
    dataExtension?:string;
    cellularNumber?: string;
    packFinal?: string;
    mensajeVariables?: string;
    campoMensaje?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

interface RequestBody {
    billNumber: number;
    channel: string;
    services: string[];
}

interface ResponseBody {
    responseCode: number;
    responseMessage: string;
    client: null;
    offerServices: {
        id: string;
        pendingProvisioning: boolean;
        offerPacks: {
            packId: string;
            order: number;
            description: string;
            priceTax: {
                amount: number;
                currency: string;
            };
            canBePurchased: boolean;
            detail: {
                price: {
                    amount: number;
                    currency: string;
                };
                initialVolume: number;
                initialUnit: string;
                volumeThreshold: number;
                timeThreshold: number;
                volumeTime: number;
                type: string;
                unitsTime: string;
                isRenewable: boolean;
            };
            reasons: {
                code: string;
                description: string;
            }[];
            paymentsMethods: {
                method: string;
                canBePurchased: boolean;
            }[];
        }[];
        activePacks: any[];
        blockingReason: null;
    }[];
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
        async (err: any, decoded?: DecodedBody) => {
            if (err) {
                console.error(err);
                return res.status(401).end();
            }
            if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {

                const { CLARO_OFFERS_API_URL} = process.env;

                let packsType: string | null = null;
                let cellularNumber: string | null = null;
                let packFinal: string | null = null;
                let packMsj: string | null = null;
                for (const argument of decoded.inArguments) {
                    if (argument.mensajeVariables) packMsj = argument.mensajeVariables;
                    if (packMsj) break;
                }
                if (!packMsj) return res.status(400).send('Input parameter is missing.');


                const offersRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };
                let packsValidationFailed = false;
                const offersApiResponse: { data: ResponseBody } | null = await axios({
                    method: 'post',
                    url: CLARO_OFFERS_API_URL,
                    data: {
                        billNumber: Number(cellularNumber),
                        channel: offersApiChannel,
                        services: ["GPRS"],
                    } as RequestBody,
                    headers: {
                        Country: 'AR',
                        'Session-Id': 'SF',
                    },
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                })
                    .catch((err) => {
                        offersRequestDurationTimestamps.end = performance.now();
                        if (err.response) {
                            const { data, status } = err.response;
                            specialConsoleLog(cellularNumber!, 'OFFERS_REQUEST_FAILED', offersRequestDurationTimestamps, { data, status });
                        }
                        console.log('Error when calling the offers API:');
                        console.log(err);
                        return null;
                    });
                offersRequestDurationTimestamps.end = performance.now();

                let packFound = null;
                if (offersApiResponse) {
                    if (offersApiResponse.data) {
                        specialConsoleLog(
                            cellularNumber,
                            'OFFERS_RESPONSE',
                            offersRequestDurationTimestamps,
                            offersApiResponse.data,
                        );
                    }
                    try {
                        for (const service of offersApiResponse.data.offerServices) {
                            for (const pack of service.offerPacks) {
                                if (pack.packId === packFinal && pack.canBePurchased === true) {
                                    packFound = pack;
                                    break;
                                }
                            }
                            if (packFound !== null) break;
                        }
                    } catch (err) {
                        console.log(`Error when processing the response data from the offers API:`);
                        console.log(err);
                        packsValidationFailed = true;
                    }
                } else packsValidationFailed = true;

                let messageToSend = '';

                if (packFound && !packsValidationFailed) {
                    const { unitsTime, initialVolume, initialUnit, volumeTime } = packFound.detail;
                    const { description, priceTax } = packFound;

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
                            const errorMessage = `Unexpected error. Invalid 'unitsTime' value: ${unitsTime}`;
                            console.log(errorMessage);
                            return res.status(500).end(errorMessage);
                    }

                    const discountValue = getDiscountValueFromPackDescription(description);

                    messageToSend = packMsj
                        .trim()
                        .replace('#C#', `${initialVolume}${initialUnit}`)
                        .replace('#V#', `${volumeTime} ${volumeTime === 1 ? unitsTimeWord.singular : unitsTimeWord.plural}`)
                        .replace('#P#', String(Math.round((priceTax.amount + Number.EPSILON) * 100) / 100))
                        .replace('#D#', discountValue !== null ? String(discountValue) : '#D#');
                }

                const response = {
                    mensajeTraducido: messageToSend,
                };
        
                return res.status(200).send(response);
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

const getDiscountValueFromPackDescription = (packDescription: string) => {
    let i = packDescription.search('%Descuento');
    if (i === -1) {
        const result = Number(
            packDescription
                .replace('-', '')
                .replace('%', ''),
        );
        if (result) return result;
        else {
            const equalSymbolIndex = packDescription.search('=');
            if (equalSymbolIndex !== -1) {
                const discountSection = packDescription.substring(equalSymbolIndex);
                const minusSymbolIndex = discountSection.search('-');
                if (minusSymbolIndex === -1) return null;
                else {
                    const percentSymbolIndex = discountSection.search('%');
                    if (percentSymbolIndex === minusSymbolIndex + 3) {
                        return Number(
                            discountSection.substring(
                                minusSymbolIndex + 1,
                                percentSymbolIndex,
                            ),
                        );
                    } else return null;
                }
            } else return null;
        }
    }
    let discountValueCharacters = [];
    let equalSymbolFound = false;
    while (!equalSymbolFound) {
       i -= 1;
       const character = packDescription[i];
       if (character !== '=') discountValueCharacters.unshift(character);
       else equalSymbolFound = true;
    }
    let result = '';
    for (const character of discountValueCharacters) {
       result += character;
    }
    return Number(result);
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
