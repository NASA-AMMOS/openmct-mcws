import MCWSStreamWorkerScript from 'raw-loader!./MCWSStreamWorkerScript.js';

const blob = new Blob(
    [MCWSStreamWorkerScript],
    {type: 'application/javascript'}
);

const objectUrl = URL.createObjectURL(blob);

export default function run() {
    const worker = new Worker(objectUrl);
    const allowedOrigin = window.location.origin;

    worker.postMessage({
        key: 'establish-origin',
        value: { origin: allowedOrigin }
    });

    return worker;
}
