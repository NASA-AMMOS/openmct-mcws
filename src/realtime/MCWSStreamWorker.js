const workerInstance = new Worker(
  new URL('./MCWSStreamWorkerScript.js', import.meta.url),
  {
    type: 'classic', // Your worker uses an IIFE format, so 'classic' is appropriate
    name: 'MCWSStreamWorker'
  }
);

export default function run() {
  return workerInstance;
}
