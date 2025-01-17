const { exec } = require('child_process')
const commandExistsSync = require('command-exists').sync
const { ARDENT_TRADE_DB } = require('./consts')

const VMTOUCH = '/usr/bin/vmtouch'

module.exports = () => {
  if (commandExistsSync(VMTOUCH)) {
    // Try (but don't require) to keep all trade database files in memory cache.
    //
    // Other databases like the Station and even much larger Systems database
    // work fine without being in memory, the trade database is a special case,
    // due to the nature of the data and the many ways it can be queried.
    //
    // Note: Not using vmtouch in daemon mode by design - too many side effects
    // but best effort prompting every 5 minutes is fine. It takes between ~90
    // seconds to run from cold boot and < 1 second if already fully cached.
    exec(`${VMTOUCH} -t ${ARDENT_TRADE_DB}*`, (error, stdout, stderr) => {
      if (error) console.error(error)

    })
  }
}
