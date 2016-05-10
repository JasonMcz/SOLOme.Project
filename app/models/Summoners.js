var mongoose = require('mongoose');

var SummonerSchema = new mongoose.Schema({
    region: String,
    summoner_id: {type:Number, unique: true},
    summoner_name: String,
    verified: Boolean,
    total_win: {
        type: Number,
        default: 0
    }, //[{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
    total_lose: {
        type: Number,
        default: 0
    },
    rating: {
            type: Number,
            default: 1200
    },
    games: [{
        game_id: String,
        match_id: Number,
        wonBy: Number
      }] // [{gameid}]
});

mongoose.model('Summoner', SummonerSchema);
