import cluster, { Worker } from 'cluster';
import os from 'os';
import { logger } from './logger';

const cpus = os.cpus().length;

// TODO: Once we know how to share socket.io connections
// across instances, increase this.
const maxWorkers = 1;

const workers: Worker[] = [];

const spawnWorker = () => {
    const worker = cluster.fork();
    logger.info(`Spawned worker ${worker.id}`);

    worker.on("exit", (code, signal) => {
        logger.warn(`Worker ${worker.id} exited with code ${code}`);
        workers.splice(workers.indexOf(worker), 1);

        setTimeout(() => {
            spawnWorker();
        }, 1000);
    });

    workers.push(worker);
};

if (cluster.isPrimary) {
    let i = 0;

    // Spawn each worker with a 1s delay to prevent CPU load
    // overqueueing
    const spawn = () => {
        setTimeout(() => {
            if (i++ < Math.min(maxWorkers, cpus)) {
                spawnWorker();
                spawn();
            }
        }, 1000);
    };
    spawn();
}
else {

    // const httpServer = http.createServer();
    // const io = new Server(httpServer);

    // // use the cluster adapter
    // io.adapter(createAdapter());

    // // setup connection with the primary process
    // setupWorker(io);

    // Workers will run the normal webserver service.
    require('./main');
}