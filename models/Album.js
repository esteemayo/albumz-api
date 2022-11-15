const slugify = require('slugify');
const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    artist: {
      type: String,
      trim: true,
      required: [true, 'Album must have an artist'],
    },
    title: {
      type: String,
      trim: true,
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
      set: (val) => Math.round(val * 10) / 10,
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
    image: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
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

albumSchema.statics.getFeaturedAlbums = async function () {
  return await this.aggregate([
    {
      $match: {
        featured: true,
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $sample: { size: 6 },
    },
  ]);
};

albumSchema.statics.getAlbumStats = async function () {
  const today = new Date();
  const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
  const prevYear = new Date(today.setFullYear(lastYear.getFullYear() - 1));

  return await this.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
        createdAt: { $gte: prevYear },
      },
    },
    {
      $project: {
        year: { $year: '$createdAt' },
        numRating: '$ratingsQuantity',
        avgRating: '$ratingsAverage',
      },
    },
    {
      $group: {
        _id: '$year',
        numAlbums: { $sum: 1 },
        numRating: { $sum: '$numRating' },
        avgRating: { $avg: '$avgRating' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

albumSchema.statics.getTopAlbums = async function () {
  return this.aggregate([
    {
      $lookup: {
        from: 'reviews',
        foreignField: 'album',
        localField: '_id',
        as: 'reviews',
      },
    },
    {
      $match: {
        'reviews.1': { $exists: true },
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $project: {
        title: '$title',
        reviews: '$reviews',
        slug: '$slug',
        image: '$image',
        artist: '$artist',
        avgRating: { $avg: '$reviews.rating' },
      },
    },
    {
      $sample: { size: 10 },
    },
    {
      $sort: { avgRating: -1 },
    },
    {
      $limit: 10,
    },
  ]);
};

const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);

module.exports = Album;
