const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    album: {
      type: mongoose.Types.ObjectId,
      ref: 'Album',
      required: [true, 'A history must belong to an album'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A history must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

historySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'album',
    select: 'artist title genre info year label',
  });

  next();
});

const History =
  mongoose.models.History || mongoose.model('History', historySchema);

module.exports = History;
