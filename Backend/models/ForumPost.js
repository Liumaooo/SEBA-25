const mongoose = require('mongoose');

const ForumPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  // likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  likedBy: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  description: { type: String, trim: true },
  isUserPost: { type: Boolean, default: false },

}, {timestamps: true});

// NEU / KORRIGIERT: Virtuelles Feld für die Like-Anzahl, basierend auf der Länge des likedBy-Arrays
// Dies ist entscheidend, damit das Frontend likesCount erhält
ForumPostSchema.virtual('likes').get(function() {
    return this.likedBy ? this.likedBy.length : 0;
});

// WICHTIG: Sicherstellen, dass virtuelle Felder bei der JSON-Ausgabe enthalten sind
ForumPostSchema.set('toJSON', { virtuals: true });
ForumPostSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('ForumPost', ForumPostSchema);