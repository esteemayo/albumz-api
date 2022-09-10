const slugify = require('slugify');
const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    artist: {
      type: String,
      required: [true, 'Album must have an artist'],
    },
    title: {
      type: String,
      required: [true, 'Album must have must a title'],
    },
    genre: {
      type: String,
      required: [true, 'Album must belong to a genre'],
    },
    slug: String,
    info: {
      type: String,
      required: [true, 'Please provide the album info'],
    },
    year: {
      type: String,
      required: [true, 'Album must have a year of release'],
    },
    label: {
      type: String,
      required: [true, 'Please tell us your record label'],
    },
    tracks: {
      type: Number,
      required: [true, 'Please tell us your album number of tracks'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    tags: {
      type: Array,
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'Album should have at least one tag',
      },
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'An album must belong to a user'],
    },
    likes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

albumSchema.index({
  artist: 'text',
  title: 'text',
  genre: 'text',
});

albumSchema.index({ title: 1, artist: 1 });
albumSchema.index({ genre: 1, slug: -1 });

albumSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'album',
  localField: '_id',
});

albumSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, { lower: true });

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const albumWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (albumWithSlug.length) {
    this.slug = `${this.slug}-${albumWithSlug.length + 1}`;
  }
});

albumSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name username location avatar',
  });

  next();
});

albumSchema.statics.getTagsList = function () {
  return this.aggregate([
    {
      $unwind: '$tags',
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);

module.exports = Album;
