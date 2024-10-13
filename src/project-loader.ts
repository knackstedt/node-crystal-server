import sqlite3 from 'better-sqlite3';
import { CrystalAsset } from './types';
import { logger } from './logger';

export const LoadFileMappings = (projectPath: string) => {
    const db = sqlite3(projectPath + '/database.sqlite', {
        fileMustExist: true,
        readonly: true,
    });

    // Query to get the assets (urls) and their metadata from the db.
    const sql = `
            SELECT r.id, r.url, rr.request_cookie, rr.error, rr.metadata
            FROM resource r
            JOIN resource_revision rr ON rr.resource_id = r.id;
        `;
    // ...Why is this synchronous?
    const rows = db.prepare(sql).all();

    return rows.map((r: object) => {
        // Try to parse the URL. This has failed during development
        // on some stored URLs and it's unclear whether that's an issue
        // here or on the archiver.
        try {
            const url = new URL(r['url']);
    
            return {
                ...r,
                metadata: JSON.parse(r['metadata']),
                host: url.host,
                path: url.pathname,
                query: url.search,
                hash: url.hash,
                port: url.port,
            } as CrystalAsset 
        }
        catch(err) {
            logger.warn({
                msg: "Failed to parse URL for crystal asset.",
                message: err.message,
                stack: err.stack,
                asset: r
            })
            return null;
        }
    })
    .filter(r => r);
}