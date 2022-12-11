import slugify from 'slugify';
import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A genre must have a name'],
    },
    slug: String,
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A genre must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

genreSchema.pre('save', function (next) {
  if (!this.isModified('name')) return next();

  this.slug = slugify(this.name, { lower: true });
  next();
});

genreSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name username avatar',
  });

  next();
});

const Genre = mongoose.models.Genre || mongoose.model('Genre', genreSchema);

export default Genre;
