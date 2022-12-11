import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    album: {
      type: mongoose.Types.ObjectId,
      ref: 'Album',
      required: [true, 'A bookmark must belong to an album'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A bookmark must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'album',
    select: 'artist title genre info year label',
  });

  next();
});

const Bookmark =
  mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
