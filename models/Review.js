const mongoose = require('mongoose');
const Album = require('./Album');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'A review cannot be empty'],
      minlength: [30, 'A review must have more or equal than 30 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must not be below 1.0'],
      max: [5, 'Rating must not be above 5.0'],
    },
    album: {
      type: mongoose.Types.ObjectId,
      ref: 'Album',
      required: [true, 'A review must belong to an album'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ album: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name username location avatar',
  });

  next();
});

reviewSchema.statics.calcAvgRatings = async function (albumId) {
  const stats = await this.aggregate([
    {
      $match: { album: albumId },
    },
    {
      $group: {
        _id: '$album',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Album.findByIdAndUpdate(albumId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Album.findByIdAndUpdate(albumId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAvgRatings(this.album);
});

// for update and delete review
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  await doc.constructor.calcAvgRatings(this.r.album);
  next();
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;
