import fs from 'fs';
import json5 from 'json5';

let conf = '{}';
try { conf = fs.readFileSync('/data/config.json', 'utf8') } catch(ex) {}

const configuration = json5.parse(conf);

const is_production = process.env['NODE_ENV'] == 'production';

export const environment = {
    is_production,
    port: configuration.port || 3000,

    projects: configuration.projects || [
        {
            domain: "localhost",
            path: "/mnt/volume1/websites/example.com.crystalproj",
        }
    ]
};
