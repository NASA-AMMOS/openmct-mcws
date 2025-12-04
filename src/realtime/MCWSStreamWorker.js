// const workerInstance = new Worker(
//   new URL('./MCWSStreamWorkerScript.js', import.meta.url),
//   {
//     type: 'classic', // Your worker uses an IIFE format, so 'classic' is appropriate
//     name: 'MCWSStreamWorker'
//   }
// );

import MCWSStreamWorkerScript from './MCWSStreamWorkerScript.js';

const blob = new Blob([MCWSStreamWorkerScript], { type: 'application/javascript' });

const objectUrl = URL.createObjectURL(blob);

export default function run() {
  return new Worker(objectUrl);
}
