/**
* MatchMaker API
**/


var express = require('express');
var router = express.Router();
var searchTree = require('./MMTree.js');
var Q = require('q');

var mongoose = require('mongoose');
var Games = mongoose.model('Game');


var MatchTree = new searchTree;

var G = [];


/**
* Endpoint '/match' consumes summoners data who requested to get matched
* If he gets matchd returns match data. Otherwise returns waiting message
*/
router.route('/')
  .post(function(request, response){
    var summoner = request.body.summoner;
    var match = MatchTree.add(summoner);
    if (match == undefined) {
      response.status("200").send({result: 'wait'});
    } else {
      var promise = createGame(match, function(err, data){
        console.log('this is data', data);
        if(data.status == true) {
          G.push(match);
          response.status('200').send({result: 'matched', data: match});
        }
        if(data.status == false) {
         response.status('304').send({result: 'failure', message: data.message});
       }
      });
    };
  });

  /**
  * Endpoint '/match/update' serves the users who are waiting to get matched.
  * The function searches for correct match, and if found returns match data.
  * Otherwise returns waiting message
  */
router.route('/update')
    .post(function(request, response){
      var summonerID = request.body.id;
      var found = false;
      for (var i = 0; i<G.length; i++) {
        var match = G[i];
        if(match.summoner1.id == summonerID || match.summoner2.id == summonerID){
          response.status('200').send({result: 'matched', data: match});
          G.splice(i,1);
          found = true
          break;
      }
    }
      if (found == false) {
        response.status('200').send({result: 'wait'});
      }
    });


    /**
    * Supporting function that creates a game entry in the database.
    * Returns true if the game is saved without issues
    * @param {object} game to be saved
    * @return {boolean}
    * @method createGame
    */
  function createGame(match, callback){
    var time = match.time;
    var participant1 = match.summoner1.id;
    var participant2 = match.summoner2.id;
    var mmr1 = match.summoner1.mmr;
    var mmr2 = match.summoner2.mmr;
    var gameID = match.gameID;

    var Game = new Games;
    Game.create_time = time;
    Game.created_by = 0;
    Game.game_id = gameID;
    Game.match_id = '';
    Game.game_mode = 'normal';
    Game.firstblood = '';
    Game.firstturret = '';
    Game.winner = '';
    Game.adjust_factor = '';
    Game.participant1 = participant1;
    Game.participant2 = participant2;
    Game.ratings.push({
      participant1: mmr1,
    },
    {
      participant2: mmr2,
    });
    // game.ratings.push({rating: 0, playedBy:req.body.participant2._id});
    Game.rating_delta.push({
      participant1: 0
    },
    {
      participant2: 0
    });
    // game.rating_delta.push({change: 0, playedBy:req.body.participant2._id});
    Game.status = 'open';
    var deferred = Q.defer();
    Game.save(function(err, games) {
        if (err) {
          console.log('error', err);
          deferred.resolve({message: err.message, status: false});
        } else if (!games) {
          deferred.resolve({message: "Duplicate!", status: false});
        } else {
          deferred.resolve({message: 'alles Gut', status: true});
        }
    });
    return deferred.promise.nodeify(callback);
  };

  module.exports = router;
