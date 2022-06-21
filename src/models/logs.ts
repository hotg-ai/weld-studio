import { Methods } from "console-feed/lib/definitions/Console";

export type forgeLog = {
    id: string;
    type: Methods;
    message: string;
};

export type forgeLoggerParams = {
    type: Methods;
    message: string;
};