import { Message } from "console-feed/lib/definitions/Component";

export type BuildInfo = {
    startTimestamp?: string;
    status?: 'success' | 'error' | 'warning' | 'info';
    testurl?: string;
    logs: Message[];
};

export type BuildStatus = {
    s3DownloadUrl?: string | undefined;
    expired: boolean;
    id: number;
    commitId: string,
    running: boolean;
    createdAt: string; //moment.Moment;
};

export type BuildLogParams = {
    latestBuild?: BuildStatus;
};
