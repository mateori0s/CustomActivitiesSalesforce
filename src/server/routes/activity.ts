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
    dataExtension?:string;
    campoMensaje?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

interface RequestBody { //////????
    billNumber: number;
    channel: string;
    services: string[];
}

interface ResponseBody {
    responseCode: number;
    responseMessage: string;
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
                let packMsj: string | null = null;
                for (const argument of decoded.inArguments) {
                    if (argument.campoMensaje) packMsj = argument.campoMensaje;
                    if (packMsj) break;
                }
                if (!packMsj) return res.status(400).send('Input parameter is missing.');


                const offersRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };
                let packsValidationFailed = false;
                const offersApiResponse: { data: ResponseBody } | null = await axios({
                    method: 'post',
                    url: CLARO_OFFERS_API_URL,
                    data: {
                        
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
                        }
                        console.log('Error when calling the offers API:');
                        console.log(err);
                        return null;
                    });
                offersRequestDurationTimestamps.end = performance.now();

                let messageToSend = '';

                if (!packsValidationFailed) {
                    messageToSend = packMsj
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
