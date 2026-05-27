const SeatHold = require('./models/seatHold.model');
const { getIO } = require('./socket');

let intervalHandle = null;

async function processExpiredHolds() {
  try {
    const now = new Date();
    const expiredHolds = await SeatHold.find({ status: 'active', expiresAt: { $lte: now } });
    if (!expiredHolds.length) return;

    const io = getIO();

    for (const hold of expiredHolds) {
      try {
        await SeatHold.findByIdAndUpdate(hold._id, { status: 'expired' });

        // emit release event to train room
        io.to(`train_${hold.trainId}`).emit('seat:release', {
          seatIds: hold.seatIds,
          holdId: hold._id
        });
      } catch (err) {
        console.warn('Error processing expired hold', err.message);
      }
    }
  } catch (err) {
    console.error('Hold cleaner failed:', err.message);
  }
}

function startCleaner(intervalMs = 30 * 1000) {
  if (intervalHandle) return;
  intervalHandle = setInterval(processExpiredHolds, intervalMs);
  // run once immediately
  processExpiredHolds().catch(() => {});
}

function stopCleaner() {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
}

module.exports = { startCleaner, stopCleaner };
