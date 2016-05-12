var express = require('express');
var app = express();
var router = express.Router();
var querystring = require('querystring');
var https = require('https');
var bodyParser = require('body-parser');
var Client = require('node-rest-client').Client;
var client = new Client();

// var MatchMaker = require('../anxiliary/MatchMaking/MatchMaker.js');

var mongoose = require('mongoose');
var Mmr = mongoose.model('Mmr');
var Summoners = mongoose.model('Summoner');
var Games = mongoose.model('Game');
var dbURI = 'mongodb://Anik657:solome@ec2-54-152-247-43.compute-1.amazonaws.com:27017/solomeDB';

// app.use('/match', MatchMaker);

// create ENV variables for all API calls
var api_key = "********-*******-******-****";
var host = "https://na.api.pvp.net/api/lol/";


function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
};

//agenda for schedule tasks
mongoose.connect(dbURI);

// var jobs = mongoose.connection.collection('jobs');
var Agenda = require('agenda');
var agenda = new Agenda();
agenda
    .database(dbURI)
    // .processEvery('3 minutes')
    // .collection('agendajobs')
;

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

var calcMMR = function(MMR1, MMR2) {
    var adjustment = (Number(MMR1) - Number(MMR2)) / 20;
    var s1 = 20 - Math.min(Math.max(adjustment, -19), 20);
    return [adjustment, s1]
};

var graceful = function() {
  return agenda.cancel({
    repeatInterval: {
      $exists: true,
      $ne: null
    }
  }, function(err, numRemoved) {
    return agenda.stop(function() {
      return process.exit(0);
    });
  });
};

//agenda job to close 'open' status game after being created more than 15 minutes,
//return the updated game
agenda.define('abort games', function(job) {
    Games.find({
            'status': 'open'
        })
        .lte('create_time', addMinutes(new Date, -10))
        .exec(
            function(err, games) {
                if (err) {
                    return next(err);
                }
                var ids = [];
                for (var i = 0; i < games.length; ++i) {
                    ids.push(games[i]._id);
                }
                Games.update({
                    _id: {
                        "$in": ids
                    }
                }, {
                    status: 'aborted'
                }, {
                    multi: true
                }, function(err, games) {
                    if (err) {
                        return next(err);
                    }
                    console.log(games);
                });
            }
        );
});

//agenda job to change 'open' status games after being checked agaisnt riot gaming server for starting status
//if found, update the following information champion_ids, match_id,
//and then return the updated game
agenda.define('check progress', function(job) {
    console.log("being called!");
    Games.find({ status: 'open'})
        .where('participant2').ne(null)
        .exec(
            function(err, games) {
                if (err) {
                    return next(err);
                }
                // console.log(games);
                console.log(games[0]);
                if (!!games[0]) {
                    for (var i = 0; i < games.length; ++i) {
                        var summoner_id = games[i].participant1;
                        var participant1 = games[i].participant1;
                        var participant2 = games[i].participant2;
                        var game_id = games[i]._id;
                        client.get("https://na.api.pvp.net/observer-mode/rest/consumer/getSpectatorGameInfo/NA1/" + summoner_id + "?api_key=" + api_key, function(data, response) {
                            if (!!data.status) {
                                console.log('did not find current game!!');
                                return
                            } else {
                                console.log('found an existing game!!')
                                var match_id = data.gameId;
                                //function to check if summoner id matches with participant id
                                if (data.participants[0].summonerId == summoner_id) {
                                    var champion_id1 = {
                                        [participant1]: data.participants[0].championId
                                    };
                                    var champion_id2 = {
                                        [participant2]: data.participants[1].championId
                                    };
                                    var participant1_team = 100;
                                    var participant2_team = 200;
                                } else {
                                    var champion_id1 = {
                                        [participant1]: data.participants[1].championId
                                    };
                                    var champion_id2 = {
                                        [participant2]: data.participants[0].championId
                                    };
                                    var participant1_team = 200;
                                    var participant2_team = 100;
                                }

                                Games.update({'_id': game_id}, {
                                        $set: {
                                            "match_id": match_id,
                                            "status": 'progress',
                                            "participant1_team": participant1_team,
                                            "participant2_team": participant2_team
                                        },
                                        $push: {
                                            "champion_ids": {
                                                $each: [champion_id1, champion_id2]
                                            }
                                        }
                                    },
                                    function(err, result) {
                                        if (err) throw err;
                                        console.log(result);
                                    });

                                return
                            }
                        });
                    }
                }
            });
});

//agenda job to check 'progress' status games that have been created for more than 20 minutes
//against riot gaming server after a game being completed.
//if game_id was found on server, update the following information against Games Db
//firstblood, firtturret, winner
agenda.define('check result', function(job) {
    console.log('check result: being called');
    Games.find({
            'status': 'progress'
        })
        .lte('create_time', addMinutes(new Date, -15))
        .exec(
            function(err, games) {
              console.log(games);
              if (err) { return next(err)}
              if (!!games[0]) {
                  for (i = 0; i < games.length; ++i) {
                        var match_id = games[i].match_id;
                        var game_id = games[i].game_id;
                        var participant1_team = games[i].participant1_team;
                        var participant1 = games[i].participant1;
                        var participant2 = games[i].participant2;
                        var MMR1 = games[i].ratings[0].participant1; //access MMR1 info
                        var MMR2 = games[i].ratings[1].participant2; //access MMR2 info
                        var dataMMR = calcMMR(MMR1, MMR2);
                        var adjust_factor = dataMMR[0];
                        var firstblood, firstturret, winner, rating_delta1, rating_delta2;

                        client.get(host + "na/v2.2/match/" + match_id + "?api_key=" + api_key, function(data, response) {
                          //404 status handler, if yes, do nothing.
                          console.log(data);
                          if (!!data.status) {console.log('Check Result: did not find the game!!')}
                          else if (data.teams[0].teamId == participant1_team) {
                                  if (data.teams[0].firstBlood) {
                                      var firstblood = participant1;
                                  } else {
                                      var firstblood = participant2;
                                  }
                                  if (data.teams[0].firstTower) {
                                      var firstturret = participant1;
                                  } else {
                                      var firstturret = participant2;
                                  }
                                  if (data.teams[0].winner) {
                                      var winner = participant1;
                                  } else {
                                      var winner = participant2;
                                  }
                                  // console.log("before the client.get", firstblood, firstturret, winner);
                          } else {
                                if (data.teams[1].firstBlood) {
                                     var firstblood = participant2;
                                } else {
                                     var firstblood = participant2;
                                }

                                if (data.teams[1].firstTower) {
                                     var firstturret = participant2;
                                } else {
                                     var firstturret = participant2;
                                }

                                if (data.teams[1].winner) {
                                     var winner = participant2;
                                } else {
                                     var winner = participant2;
                                }
                                // console.log("before the client.get", firstblood, firstturret, winner);
                          }

                          // console.log("after the client.get", firstblood, firstturret, winner);
                            if (winner == participant1) {
                                 var rating_delta1 = dataMMR[1];
                                 var rating_delta2 = -dataMMR[1]; //participant 1 lose case
                            } else {
                                 var rating_delta1 = -dataMMR[1];
                                 var rating_delta2 = dataMMR[1]; //participant 2 lost case
                            }

                            Games.update({'game_id': game_id}, {
                                     $set: {
                                         "firstblood": firstblood,
                                         "firstturret": firstturret,
                                         "winner": winner,
                                         "status": 'completed',
                                         "adjust_factor": Number(adjust_factor),
                                     },
                                     $push: {
                                       $each: [{'participant1':rating_delta1},{"participant2":rating_delta2}]
                                     }
                                   },
                                    function(err, result) {
                                       if (err) {
                                           console.log(err);
                                       }
                                       console.log(result);
                                   });
                                   //update the players, player1

                             Summoners.where({
                                     summoner_id: participant1
                                 })
                                 .update({
                                     $inc: {
                                         rating: Number(rating_delta1)
                                     },
                                     $push: {
                                         "games": {
                                             'game_id': game_id,
                                             'match_id': match_id,
                                             'wonBy': winner
                                         }
                                     }
                                 }, function(err, result) {
                                     if (err) {console.log(err)};
                                     console.log(result);
                                    //  res.send(result);
                                 });
                                   //player 1 ends
                                   //plyaer 2 starts
                               Summoners.where({
                                       summoner_id: participant2
                                   })
                                   .update({
                                       $inc: {
                                           rating: Number(rating_delta2)
                                       },
                                       $push: {
                                           "games": {
                                               'game_id': game_id,
                                               'match_id': match_id,
                                               'wonBy': winner
                                           }
                                       }
                                   }, function(err, result) {
                                       if (err) {console.log(err)};
                                       console.log(result);
                                      //  res.send(result);
                                   });

                        });
                        // console.log("outside the client.get", firstblood, firstturret, winner);

                        }//for loop closing bracket here

                      } else {
                        return
                      }//if bracket
            });
        });
//agenda define ends


//agenda.initialize from here
agenda.on('ready', function() {
    agenda.every('30 seconds', 'abort games');
    agenda.every('30 seconds', 'check progress');
    agenda.every('30 seconds', 'check result'); //'open' ==> 'progress'
    // agenda.processEvery('180 seconds', 'check games result');// 'progress' ==> 'completed'
    agenda.start();
});

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

//Middleware, param for summoner_id
router.param('summoner_id', function(req, res, next, id) {
    var query = Summoners.findOne({
        'summoner_id': id
    });

    query.exec(function(err, summoner) {
        if (err) {
            return next(err)
        };
        if (!summoner) {
            res.status('200').send({
                result: 'failure',
                reason: 'Summoner does not exist!'
            });
        } else {
            res.summoner_id = summoner;
            return next();
        };

    });

});
//Middleware, param for summoner_id ends

//Middleware, param for game_id
router.param('game_id', function(req, res, next, id) {
    var query = Games.findOne({
        'game_id': id
    });

    query.exec(function(err, game) {
        if (err) {
            return next(err)
        };
        if (!game) {
            res.status('200').send({
                result: 'failure',
                reason: 'Game does not exist!'
            });
        } else {
            res.game_id = game;
            return next();
        };

    });

});
//Middleware, param for game_id ends

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

//Game related API endpoints

//Get last 10 games
router.get('/games', function(req, res, next) {
    Games.find(function(err, games) {
        if (err) {
            return next(err);
        }
        res.send(games);
    });
});
//Get last 10 games ends

//Get specific game by game_id
router.get('/games/:game_id', function(req, res, next) {
    res.json(res.game_id);
});
//Get specific game by game_id ends

//Get lastGame
router.get('/lastGame', function(req, res, next) {
    Games.findOne().sort('-game_id').limit(1).exec(function(err, game) {
        if (err) return console.error(err);
        res.send(game);
    });
});
//Get lastGame ends

//createGame
router.post('/games/create', function(req, res, next) {
    // console.log(req.body);
    if (!req.body.status || !req.body.game_mode || !req.body.participant1 || !req.body.create_time) {
        res.status('200').send({
            result: 'failure',
            reason: 'Missing one or more data fields.'
        });
    } else if (req.body.participant1 == req.body.participant2) {
        res.status('200').send({
            result: 'failure',
            reason: 'Duplicate IDs, you cannot solo yourself mate!'
        });
    } else {
        //changed to reflect game_id hashing
        var create_time = +new Date;
        var game_id = req.body.participant1.toString() + create_time.toString();
        req.body.game_id = Number(game_id).toString(36);

        Games.findOne({
                $or: [{
                    'status': 'open'
                }, {
                    'status': 'progress'
                }],
                'participant1': req.body.participant1
            },
            function(err, games) {
                console.log(games);
                if (err) {
                    return next(err);
                } else if (!!games) {
                    res.send({
                        result: 'failure',
                        reason: 'you can only create one game at a time!'
                    });
                } else {

                    // console.log('debug_log:' + req.body);

                    var Game = new Games;
                    Game.create_time = req.body.create_time;
                    Game.created_by = req.body.created_by;
                    Game.game_id = req.body.game_id;
                    Game.match_id = '';
                    Game.game_mode = req.body.game_mode;
                    Game.firstblood = '';
                    Game.firstturret = '';
                    Game.winner = '';
                    Game.adjust_factor = '';
                    Game.participant1 = req.body.participant1;
                    Game.participant1_name = req.body.participant1_name;
                    Game.participant1_team = '';
                    if (!!req.body.participant2) {
                        Game.participant2 = req.body.participant2;
                        Game.participant2_name = req.body.participant2_name;
                        Game.participant2_team = '';
                    } else {
                        Game.participant2 = '';
                        Game.participant2_name = '';
                        Game.participant2_team = '';
                    };
                    Game.ratings.push({
                        participant1: req.body.rating
                        // playedBy: req.body.participant1._id
                    });
                    // game.ratings.push({rating: 0, playedBy:req.body.participant2._id});
                    // Game.rating_delta.push({
                    //     participant1: 0
                    //     // playedBy: req.body.participant1._id
                    // });
                    // game.rating_delta.push({change: 0, playedBy:req.body.participant2._id});
                    Game.status = 'open';
                    Game.save(function(err, games) {
                        if (err) {
                            return next(err);
                        }
                        if (!games) {
                            res.status("200").send({
                                result: 'failure',
                                reason: 'you can only create one game at a time!'
                            })
                        }
                        res.send(games);
                    });
                }
            });
    }

});
//createGame ends

//joinGame
router.post('/games/:game/join', function(req, res, next) {

    //initialize data from req.body and req
    var game_id = req.params.game;
    var participant2 = req.body.summoner_id;
    var participant2_name = req.body.name;
    var participant2_rating = req.body.rating;

    Games.findOne({
        game_id: game_id
    }, function(err, game) {
        if (err) return console.error(err);
        if (!game) {
            res.status('200').send({
                result: "failure",
                reason: "The game does not exist!"
            });
        } else if (game.participant2 == participant2){
            res.status('200').send({
              result: "failure",
              reason: "You can't join the same game twice!"
            })
        } else {
            game.participant2 = participant2;
            game.participant2_name = participant2_name;
            game.ratings.push({
                participant2: participant2_rating
            });
            // game.rating_delta.push({
            //     participant2: 0
            // });
            game.save(function(err, game) {
                if (err) {
                    if (err) return console.error(err);
                };
                res.send({
                    result: "success"
                });
            });
        }
    });

});
//joinGame ends

//Game related API endpoints ends

//Summoners related API endpoints

//Get last 10 summoners who verified
router.get('/summoners', function(req, res, next) {
    Summoners.find(function(err, summoners) {
        if (err) {
            return console.error(err)
        };
        res.send(summoners.splice(-10));
    });
});
//Get last 10 summoners who verified ends

//lookup specific summoner who verified
router.get('/summoners/:summoner_id', function(req, res, next) {
    res.json(res.summoner_id);
});
//lookup specific summoner who verified ends

//Get last summoners who verified
router.get('/lastSummoner', function(req, res, next) {
    Summoners.findOne().sort('-summoner_id').limit(1).exec(function(err, summoner) {
        if (err) return console.error(err);
        res.send(summoner);
    });
});
//Get last summoners ends

//createSummoner
router.post('/summoners/create', function(req, res, next) {
    //console.log(req.body);//debug
    //check if the summoner exist and verified already
    var precheck_id = req.body.summoner_id;
    console.log('debug:' + req.body);
    Summoners.findOne({
        'summoner_id': precheck_id
    }, function(err, person) {
        console.log('debug:' + person);
        if (err) return handleError(err);
        if (!person) {
            if (!req.body.region || !req.body.summoner_id || !req.body.summoner_name || !req.body.verified) {
                res.status('200').send({
                    result: 'failure',
                    reason: 'Missing one or more data fields.'
                });
            } else if (req.body.total_win !== 0 || req.body.total_lose !== 0) {
                res.status('200').send({
                    result: 'failure',
                    reason: 'You are a new user, win/lose is supposed to be both 0'
                }); //server-end assertion
            } else if (typeof(req.body.summoner_id) !== 'number') {
                res.status('200').send({
                    result: 'failure',
                    reason: 'BUG:Summoner_id was not passed in as [Number]'
                }); //server-end assertion
            } else {
                var summoner = new Summoners(req.body);
                summoner.save(function(err, summoner) {
                    if (err) {
                        return next(err);
                    }
                    res.send({
                        result: 'success',
                        data: summoner
                    });
                    // res.status('200').send(summoner);
                });
            }
        } else {
            res.status('200').send({
                result: 'failure',
                reason: 'duplicate',
                data: person
            });
        }
    });

});
//createSummoner ends

//Summoners related API endpoints ends

//checkStatus of Server
router.post('/status', jsonParser, function(req, res) {
    res.status("200").send({
        result: "success"
    });
});
//checkStatus of Server ends

//getSummoner data starts
router.post('/public/summoner/data', jsonParser, function(req, res) {

    if (!req.body.name || !req.body.region) {
        res.status("200").send({
            result: "failure",
            reason: "Wrong or Empty Input"
        });
    } else {
        var name = req.body.name.toLowerCase();
        // console.log(name); //"JasonStathan"; /debug
        var region = req.body.region.toLowerCase(); //"NA"
        // console.log(region); /debug

        //Get Summoner Information
        client.get(host + region + "/v1.4/summoner/by-name/" + name + "?api_key=" + api_key,
            function(data, response) {
                // parsed response body as js object
                // raw response
                console.log(data);
                if (!data[name]) {
                    res.status("200").send({
                        result: "failure",
                        reason: "Champion not found!"
                    });
                } else {
                    var summonerInfo = data[name];
                    var id = summonerInfo.id;
                    client.get(host + region + "/v2.5/league/by-summoner/" + id + "/entry?api_key=" + api_key,
                        function(data, response) {
                            // parsed response body as js object
                            // raw response
                            // console.log("https://na.api.pvp.net/api/lol/" + region + "/v2.5/league/by-summoner/" + id + "/entry?api_key=" + api_key);
                            // console.log(id, region);
                            // console.log(data);
                            if (!data[id]) {
                                res.send({
                                    info: summonerInfo
                                });
                            } else {
                                var summonerRanked = data[id][0];
                                res.send({
                                    info: summonerInfo,
                                    ranked: summonerRanked
                                });
                            }
                            // res.json(data.name);
                        });

                }
            });
    }
});
//getSummoner data ends

router.get('/public/summoner/:id/data', jsonParser, function(req, res) {

    if (!req.params.id) {
        res.status("200").send({
            result: "failure",
            reason: "Wrong ID Input"
        });
    } else {
        //Get Summoner Information
        var id = req.params.id;
        var region = 'na';
        client.get(host + region + "/v1.4/summoner/" + id + "?api_key=" + api_key,
            function(data, response) {
                // parsed response body as js object
                // raw response
                console.log(data);
                if (!data) {
                    res.status("200").send({
                        result: "failure",
                        reason: "Champion not found!"
                    });
                } else {
                    var summonerInfo = data[id];
                    client.get(host + region + "/v2.5/league/by-summoner/" + id + "/entry?api_key=" + api_key,
                        function(data, response) {
                            // parsed response body as js object
                            // raw response
                            // console.log("https://na.api.pvp.net/api/lol/" + region + "/v2.5/league/by-summoner/" + id + "/entry?api_key=" + api_key);
                            // console.log(id, region);
                            // console.log(data);
                            if (!data[id]) {
                                res.send({
                                    info: summonerInfo
                                });
                            } else {
                                var summonerRanked = data[id][0];
                                res.send({
                                    info: summonerInfo,
                                    ranked: summonerRanked
                                });
                            }
                            // res.json(data.name);
                        });

                }

            });
    }
});

//verify info starts
router.post('/public/summoner/verify', jsonParser, function(req, res) {
    var name = req.body.name.toLowerCase();
    // console.log(name); //"JasonStathan"; /debug
    var region = req.body.region.toLowerCase(); //"NA"
    // console.log(region); /debug

    client.get(host + region + "/v1.4/summoner/by-name/" + name + "?api_key=" + api_key,
        function(data, response) {
            var id = data[name].id
            client.get(host + region + "/v1.4/summoner/" + id + "/runes?api_key=" + api_key,
                function(data, response) {
                    // parsed response body as js object
                    // raw response
                    // console.log(data.req.body.name.toLowerCase());
                    console.log(data);
                    if (data[id].pages[0].name === "solome") {
                        res.send({
                            result: "success"
                        });
                    } else {
                        res.status("200").send({
                            result: "failure",
                            reason: "Verification Failed!"
                        });
                    }
                    // res.json(data.name);
                });
        });

});
//verify info ends


//helper API clean database for testing
// cleanUp
router.get('/clean', function(req, res, next) {
    Games.remove({}, function(err) {
        if (!err) {
            res.send("success");
        } else {
            console.log(err);
        }
    });
});

// cleanUp
router.get('/clean_summoner', function(req, res, next) {
    Summoners.remove({}, function(err) {
        if (!err) {
            res.send("success");
        } else {
            console.log(err);
        }
    });
});

//test case 1
router.get('/one', function(req, res, next) {
    Games.update({
            'match_id': 2181655381
        }, {
            $set: {
                "status": 'progress'
            }
        },
        function(err, result) {
            if (err) throw err;
            console.log(result);
            res.send(result);
        });
});
//ends

//test case 2
router.get('/two', function(req, res, next) {

    Summoners.where({
            summoner_id: 24894460
        })
        .update({
            $inc: {
                rating: 20
            }
        }, function(err, result) {
            if (err) console.log(err);
            console.log(result);
            res.send(result);
        });

    // Summoners.update({
    //       'summoner_id': 24894460
    //   }, {
    //       $inc: {
    //           rating: 1220
    //       }
    //   },
    //   {upsert: true},
    //   function(err, result) {
    //       if (err) console.log(err);
    //       console.log(result);
    //       res.send(result);
    //   });
});

module.exports = router;
