app.factory('players', [function() {
    // service body
    var o = {
      players: [{
        info:{
          id: '',
          name: '',
          profileIconId: '',
          summonerLevel: '',
          revisionDate: ''
        },
        ranked:'',
        solo:'',
        verified: false
      },{
        info:{
          id: '',
          name: '',
          profileIconId: '',
          summonerLevel: '',
          revisionDate: '',
        },
        ranked:'',
        solo:'',
        verified: false
      }]
  };
    return o;
}]);

app.factory('games', ['$http', function($http){
  var o = {
    my_game: {
      status: "",
      participant2: "",
      participant1: "",
      participant1_name: "",
      participant2_name: "",
      participant1_team: "",
      participant2_team: "",
      adjust_factor: "",
      winner: "",
      firstturret: "",
      firstblood: "",
      game_mode: "",
      match_id: "",
      game_id: "",
      ratings: [],
      rating_delta: [],
      champion_ids: [],
      create_time: "",
      created_by: "",
      _id: ""
    },
    active_game: {
      status: "",
      participant2: "",
      participant1: "",
      participant1_name: "",
      participant2_name: "",
      participant1_team: "",
      participant2_team: "",
      adjust_factor: "",
      winner: "",
      firstturret: "",
      firstblood: "",
      game_mode: "",
      match_id: "",
      game_id: "",
      ratings: [],
      rating_delta: [],
      champion_ids: [],
      create_time: "",
      created_by: "",
      _id: ""
    }

  };

  o.get = function(id) {
    return $http.get('/games/' + id).then(function(res){
      if (res.data.result !== "failure") {
        o.active_game.status = res.data.status;
        o.active_game.participant1 = res.data.participant1;
        o.active_game.participant2 = res.data.participant2;
        o.active_game.participant1_name = res.data.participant1_name;
        o.active_game.participant2_name = res.data.participant2_name;
        o.active_game.participant1_team = res.data.participant1_team;
        o.active_game.participant2_team = res.data.participant2_team;
        o.active_game.adjust_factor = res.data.adjust_factor;
        o.active_game.winner = res.data.winner;
        o.active_game.firstturret = res.data.firstturret;
        o.active_game.firstblood = res.data.firstblood;
        o.active_game.game_mode = res.data.game_mode;
        o.active_game.match_id = res.data.match_id;
        o.active_game.game_id = res.data.game_id;
        o.active_game.ratings = res.data.ratings;
        o.active_game.rating_delta = res.data.rating_delta;
        o.active_game.champion_ids = res.data.champion_ids;
        o.active_game.create_time = res.data.create_time;
        o.active_game.created_by = res.data.created_by;
        o.active_game._id = res.data._id;
      } else {
        o.active_game.status = '';
        o.active_game.participant1 = '';
        o.active_game.participant2 = '';
        o.active_game.participant1_name = '';
        o.active_game.participant2_name = '';
        o.active_game.participant1_team = '';
        o.active_game.participant2_team = '';
        o.active_game.adjust_factor = '';
        o.active_game.winner = '';
        o.active_game.firstturret = '';
        o.active_game.firstblood = '';
        o.active_game.game_mode = '';
        o.active_game.match_id = '';
        o.active_game.game_id = '';
        o.active_game.ratings = '';
        o.active_game.rating_delta = '';
        o.active_game.champion_ids = '';
        o.active_game.create_time = '';
        o.active_game.created_by = '';
        o.active_game._id = '';
      }
      return res.data;
    });
  };
  return o;
}]);
