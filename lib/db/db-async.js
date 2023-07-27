const { Worker } = require('worker_threads')
const os = require('os')

const PATH_TO_WORKER = './lib/db/db-async-worker.js'

console.log('Initalizating worker threads …')

// Spawn a worker for each CPU core (with a min/max threshold)
const CPU_LOGICAL_CORES = os.cpus().length
const MAX_WORKER_COUNT = 32
const MIN_WORKER_COUNT = 4
const WORKER_COUNT = Math.max(MIN_WORKER_COUNT, Math.min(CPU_LOGICAL_CORES, MAX_WORKER_COUNT))

console.log(`LOGICAL_CORES: ${CPU_LOGICAL_CORES} | MIN WORKERS: ${MIN_WORKER_COUNT} | MAX WORKERS: ${MAX_WORKER_COUNT}`)
console.log(`Spawning ${WORKER_COUNT} worker threads …`)

// Export a function that queues pending work.
const queue = []

function asyncQuery (dbRef, sql, parameters) {
  return new Promise((resolve, reject) => {
    queue.push({
      resolve,
      reject,
      message: { dbRef, sql, parameters }
    })
    drainQueue()
  })
}

// Instruct workers to drain the queue.
let workers = []
function drainQueue () {
  for (const worker of workers) {
    worker.takeWork()
  }
}

for (let i = WORKER_COUNT; i--;) {
  spawnWorker(WORKER_COUNT - i)
}

// Spawn workers that try to drain the queue.
function spawnWorker (workerNumber = null) {
  console.log(`Spawning worker ${(workerNumber !== null) ? `#${workerNumber}` : ''}`)
  const worker = new Worker(PATH_TO_WORKER)

  let job = null // Current item from the queue
  let error = null // Error that caused the worker to crash

  function takeWork () {
    if (!job && queue.length) {
      // If there's a job in the queue, send it to the worker
      job = queue.shift()
      worker.postMessage(job.message)
    }
  }

  worker
    .on('online', () => {
      workers.push({ takeWork })
      takeWork()
    })
    .on('message', (result) => {
      job.resolve(result)
      job = null
      takeWork() // Check if there's more work to do
    })
    .on('error', (err) => {
      console.error(err)
      error = err
    })
    .on('exit', (code) => {
      workers = workers.filter(w => w.takeWork !== takeWork)
      if (job) {
        job.reject(error || new Error('Worker died'))
      }
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`)
        spawnWorker() // Worker died, so spawn a new one
      }
    })
}

// Provide non-blocking method for handling queries using worker threads
const dbAsync = {
  all: (sql, params = {}) => asyncQuery(sql, params),
  get: async (sql, params = {}) => {
    return (await asyncQuery(sql, params))?.[0] ?? null
  }
}

module.exports = dbAsync
