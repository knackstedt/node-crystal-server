import express from 'express';
import Path from 'path';
import fs from 'fs/promises'
import { environment } from './environment';
import { LoadFileMappings } from './project-loader';
import { CrystalAsset } from './types';
import { SubstituteLinks } from './dom-parser';
import { logger } from './logger';

(async () => {
    const app = express();

    // Return 200OK for health checks
    // TODO: Support more than just kubernetes here.
    app.use((req, res, next) => {
        req.get("user-agent")?.includes("kube-probe") ? res.sendStatus(200) : next()
    })
    app.use("/.well-known", (req, res, next) => res.sendStatus(200));

    const domainMap = new Map<string, {
        assets: Map<string, CrystalAsset>,
        path: string,
        rootUrls: string[],
        rootDomains: Map<string, boolean>
    }>();

    for (const { domain, path } of environment.projects) {
        try {

            const projectPath = Path.resolve(path);
            const {
                assets,
                rootUrls
            } = LoadFileMappings(projectPath);
    
            const assetMap = new Map();
            assets.forEach(a => assetMap.set(a.path, a));
            const rootDomains = new Map();
    
            rootUrls.forEach(u => {
                try {
                    const url = new URL(u);
                    rootDomains.set(url.host, true);
                }
                catch(ex) {
                    debugger;
                }
            });
    
            domainMap.set(domain, { 
                assets: assetMap, 
                path: projectPath,
                rootUrls,
                rootDomains
            });
        }
        catch(ex) {
            logger.error({
                msg: "Failed to load crystal project at" + path,
                message: ex.message,
                stack: ex.stack
            });
        }
    }

    // Router to check if there are any matching crystal asset groups to
    // serve based on the provided domain.
    // TODO: SNI/cert management?
    app.use((req, res, next) => {
        // Check if the request matches the specified domain
        // TODO: glob matches / regex
        // TODO: how does multi-domain mapping need to work here?
        // Until confirmed, I will assume this:
        /**
         * example.com -> foo.com
         *     www.example.com -> www.foo.com
         *     (@).example.com -> (@).foo.com
         */
        const { assets, path, rootDomains } = domainMap.get(req.hostname) || {};
        if (!assets) return next();

        const asset = assets?.get(req.path);

        // If we didn't get an asset, that's a 404
        if (!asset) {
            return next();
        }
        
        // Else, we should have a file on the filesystem that can be written to
        // the output stream :D

        // 4 folders 1 filename (filename starts at 1)
        // 000 / 000 / 000 / 000 / 001
        // TODO: confirm if this is to support int64 as hex

        const id = asset.id;
        const ref = id.toString(16).padStart(15, '0');

        const t0 = ref.slice(0, 3);
        const t1 = ref.slice(3, 6);
        const t2 = ref.slice(6, 9);
        const t3 = ref.slice(9, 12);
        const t4 = ref.slice(12, 15);

        const fileLocation = Path.join(path, 'revisions', t0, t1, t2, t3, t4);

        res.status(asset.metadata.status_code);
        asset.metadata.headers
            .filter(([k, v]) => !["content-length", "transfer-encoding"].includes(k))
            .forEach(([k,v]) => res.setHeader(k, v));

        const [ct, contentType] = asset.metadata.headers.find(([k, v]) => k.toLowerCase() == "content-type") || [];
        // TODO: replace in JS files?
        if (contentType?.includes("text/html")) {
            // TODO: Do we really ever need to use this? 
            const charset = contentType.match(/charset=([^;]+)/)?.[1];
            fs.readFile(fileLocation, 'utf8')
                .then(contents => {
                    res.send(SubstituteLinks(contents, rootDomains, req));
                })
                .catch(err => next(err))
            return;
        }

        res.sendFile(fileLocation);
    });

    await app.listen(environment.port);
})();
