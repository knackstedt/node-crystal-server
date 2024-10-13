import express from 'express';
import Path from 'path';
import { environment } from './environment';
import { LoadFileMappings } from './project-loader';
import { CrystalAsset } from './types';

(async () => {
    const app = express();

    // Read through the config and bind all of the projects
    const domainMap = new Map<string, { host: string, path: string }>();
    const metadataMap = new Map<string, Map<string, CrystalAsset>>();

    for (const { domainMapping, path } of environment.projects) {
        const projectPath = Path.resolve(path);
        const fileMetadata = LoadFileMappings(projectPath);
        const domains = domainMapping;

        // project the domains in reverse to act as an optimized lookup table
        domains.forEach(d => {
            domainMap.set(d.to, { host: d.from, path });
            const metadata = fileMetadata.filter(m =>
                m.host == d.from
            );
            const domainMdMap = new Map();
            metadata.forEach(md => domainMdMap.set(md.path, md));
            metadataMap.set(d.from, domainMdMap);
        });
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
        const matchedDomain = domainMap.get(req.hostname);
        if (!matchedDomain) return next();

        // Now, resolve the file based off of the match we make
        const assets = metadataMap.get(matchedDomain.host);

        // Now, we filter to all matching assets. 
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

        const fileLocation = Path.join(matchedDomain.path, 'revisions', t0, t1, t2, t3, t4);

        res.status(asset.metadata.status_code);
        asset.metadata.headers.forEach(([k,v]) => res.setHeader(k, v));
        res.sendFile(fileLocation);
    });

    await app.listen(environment.port);
})();
