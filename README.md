# NodeJS Crystal server

## Overview
This Node.js application serves as a static website archive server for Crystal Web archives. It allows users to access and browse archived versions of websites, providing a convenient interface for viewing web pages as they existed at specific points in time.

## Getting Started

### Requirements
 - One or more crystal projects to serve.
 - NodeJS installed (If not using the docker image)
 - Docker image runtime such as containerd, cri-o or docker. (Only necessary if running in docker)

### Configuration

All configuration should be stored under `/data/`. Including the websites configuration and the website data repositories themselves. They work with symlinks and / or file mounts.

```sh
/data
    ├── config.json
    # Note that it is not strictly necessary to store websites here, but it is recommended.
    └── websites
        ├── site1.crystalproj
        ├── site2.crystalproj
        └── ...
```

The main configuration file is a JSON5 formatted file located at `/data/config.json`.
```json
{
    // The port the program will listen on.
    "port": 8080,
    // An array of crystal project definitions to serve.
    "projects": [
        {
            // The domain to serve the crystal project's content on
            "domain": "localhost",
            // The path to the crystal project. 
            "path": "/mnt/volume1/websites/example.com.crystalproj",
        }
    ]
}
```

### Usage
To run the program, use the following command in your terminal:

```bash
node src/main.ts --register ts-node/register
```
This will read the configuration and startup a webserver that serves the websites based on the provided `HOST` header. 

## License
This software is released under the MIT License. See the LICENSE file for more details.

For any questions or issues, please create an issue.