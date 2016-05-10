var mongoose = require('mongoose');

var MmrSchema = new mongoose.Schema({
    summonerId: String,
    rating: {
            type: Number,
            default: 1200
    },
});

mongoose.model('Mmr', MmrSchema);
