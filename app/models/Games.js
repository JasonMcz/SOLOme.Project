var mongoose = require('mongoose');

var GamesSchema = new mongoose.Schema({
    create_time: {
        type: Date,
        default: Date.now
    },
    created_by:Number,
    game_id: {
        type: String,
        unique: true
    },
    match_id: Number,
    game_mode: String,
    firstblood: Number,
    firstturret: Number,
    winner: Number,
    adjust_factor: Number,
    participant1: Number,
    participant1_name: String,
    participant1_team: Number,
    participant2: Number,
    participant2_name: String,
    participant2_team: Number,
    champion_ids: [],
    rating_delta: [],
    status: String, //'completed' 'open', 'aborted', 'progress'
    ratings: []
});

mongoose.model('Game', GamesSchema);
