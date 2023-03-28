import MCWSStreamWorkerScript from 'raw-loader!./MCWSStreamWorkerScript.js';

const blob = new Blob(
    [MCWSStreamWorkerScript],
    {type: 'application/javascript'}
);

const objectUrl = URL.createObjectURL(blob);

export default function run() {
    return new Worker(objectUrl);
}
