app.controller('MainCtrl', [
    '$scope', '$rootScope', '$state', '$interval', '$timeout', 'players', 'SLapi', 'ngNotify', 'localStorageService', 'games',
    function($scope, $rootScope, $state, $interval, $timeout, players, SLapi, ngNotify, localStorageService, games, game) {


        //initialize data into different scopes
        $scope.players = players.players;
        $rootScope.games = games;
        $scope.region1 = "NA";
        $scope.region2 = "NA"; //default region data - hardcoded
        $rootScope.currentStep = '1';
        $rootScope.modal = false;
        $rootScope.wait = false;
        //initalization ends here

        //set up notification module parameters
        ngNotify.config({
            position: 'top',
            theme: 'pure',
            duration: 5000
        });

        //-------------------Helper APIs Section-------------------
        //localstorage submit a key
        $scope.submitLS = function(key, val) {
            return localStorageService.set(key, val);
        };
        //localstorage get a key
        $scope.getLS = function(key) {
            return localStorageService.get(key);
        };
        //localstorage remove a key
        $scope.removeLS = function(key) {
            return localStorageService.remove(key);
        };

        $rootScope.firstTime = $scope.getLS('firstTime');
        //function used to set which step is APP is currently at.
        $scope.setStep = function(data) {
            $rootScope.currentStep = data;
            $scope.submitLS('currentStep', $rootScope.currentStep);
            $timeout(function() {
                //console.log($scope.getLS('firstTime'),!!$scope.getLS('firstTime'),$rootScope.firstTime)
                if (data == '2' && $scope.getLS('firstTime') == null || data == '2' && $rootScope.firstTime == null) {
                    $rootScope.modal = true;
                } else if (data == '3') {
                    window.location.href = '#/games/' + $rootScope.games.active_game.game_id;
                }else {
                    $rootScope.modal = false;
                }
            });
        };
        //function used to prevent users access game page if game hasn't been created yet.
        $scope.checkStep = function(data) {
            if (!$scope.players[0].verified || $scope.players[0].verified == false) {
                ngNotify.set('You cannot join this game! Have you verified your runes page yet?', {
                    target: '#noGameWarning',
                    type: 'warn'
                }, $state.go('create'));
            } else if (!$rootScope.games.active_game.game_id && !$rootScope.games.my_game.game_id) {
                ngNotify.set('You cannot join a game that does not exist!', {
                    target: '#noGameWarning',
                    type: 'warn'
                }, $state.go('create'));
            } else if ($scope.players[0].verified && !!$rootScope.games.active_game.game_id) {
                return
            }
        };
        //function used to go the match player page, and set step to 2
        $scope.matchPlayer = function() {
            $scope.setStep('2');
            $rootScope.button = 'match';
            $scope.submitLS('button', 'match');
            $state.go('create')
        };
        //function used to go the create game page, and set step to 2
        $scope.joinGame = function() {
            $scope.setStep('2');
            $rootScope.button = 'create';
            $scope.submitLS('button', 'create');
            $state.go('create');
        };


        //-------------------Major APIs Section-------------------
        //function used to lookup a summoner by summoner_id
        $scope.findSummoner = function(data) {
                SLapi.User.findSummoner(data).then(function(response) {
                    if (response.result == 'failure' || !response) {
                        ngNotify.set('We could not find your summoner profile with us!', "warn");
                    } else {
                        // $scope.players[data].solo = response.data;
                        console.log(response.data);
                    };
                });
            }
            //function used to register Summoner on the server with Solome
            //function used to create Summoner using scope.players
        $scope.createSummoner = function(tag) {
            var data = {
                region: $scope.region1,
                summoner_id: $scope.players[tag].info.id,
                summoner_name: $scope.players[tag].info.name,
                verified: $scope.players[tag].verified,
                total_win: 0, //[{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
                total_lose: 0,
                rating: 1200,
                games: [] // [{gameid}] tricky! note need to pass in as array!
            };

            SLapi.User.createSummoner(data).then(function(response) {
                //NOTE: need a fucntion to check validity of the response.
                //and prompt user if it's a bad request
                // console.log(response.data); //debug
                if (response.data.result == "failure" && response.data.reason !== 'duplicate') {
                    ngNotify.set('Something went wrong as we are registering this user on our server! Due to the following: ' + response.data.reason, "warn");
                } else if (response.data.result == 'failure' || response.data.reason == 'duplicate') {
                    ngNotify.set("Summoner " + $scope.players[tag].info.name + " was already verified previously, fetching it now...", "success");
                    $scope.players[tag].verified == true;
                    $scope.players[tag].solo = response.data.data;
                    $scope.submitLS('player' + [tag], $scope.players[tag]); //updateLocalStorage
                } else {
                    ngNotify.set("Summoner " + $scope.players[tag].info.name + " has just been created!", "success");
                    $scope.players[tag].solo = response.data.data;
                    $scope.submitLS('player' + [tag], $scope.players[tag]);
                }
            });
        };
        //function used to create a 1v1 game.
        $scope.createGame = function() {
            var data = {
                create_time: new Date(),
                // id: {type:Number, unique:true},
                created_by: $scope.players[0].info.id,
                game_id: '',
                game_mode: 'normal',
                firstblood: '',
                firstturret: '',
                winner: '',
                adjust_factor: '',
                participant1: $scope.players[0].info.id,
                participant1_name: $scope.players[0].info.name,
                status: 'open',
                rating: $scope.players[0].solo.rating //'completed' 'open', 'aborted'
            };

            SLapi.User.createGame(data).then(function(response) {
                //NOTE: need a fucntion to check validity of the response.
                //and prompt user if it's a bad request
                // console.log(response.data); //debug
                if (response.data.result == "failure") {
                    ngNotify.set('This game cannot be started! Due to the following reason: ' + response.data.reason, "warn");
                    $state('create');
                    // window.location.href = '#/games/' + $rootScope.games.my_game.game_id;
                } else {
                    ngNotify.set("SOLO Game room has been created, now you can share the link to whoever you want to challenge!", "success");
                    $rootScope.games.my_game = response.data;
                    $scope.submitLS('my_game', $rootScope.games.my_game);
                    window.location.href = '#/games/' + response.data.game_id;
                }
            });
        };
        //function used to get Summoner's data from Riot API, with region and summoner_name
        $scope.getGame = function(data) {
            if (!!data) {
                SLapi.User.getGame(data).then(function(response) {
                  console.log(response);
                    if (response.result === 'failure') {
                        ngNotify.set("The game you entered doesn't exist or has been aborted!", "warn");
                        $state.go('create');
                    } else if (!!response.data.participant2) {
                        // $rootScope.games.active_game = response.data
                        $rootScope.games.active_game.status = response.data.status;
                        if($scope.players[0].id != response.data.participant1) {
                          $rootScope.games.active_game.participant1 = response.data.participant2
                          $rootScope.games.active_game.participant2 = response.data.participant1
                          $rootScope.games.active_game.participant1_name = response.data.participant2_name;
                          $rootScope.games.active_game.participant1_team = response.data.participant2_team;
                          $rootScope.games.active_game.participant2 = response.data.participant1;
                          $rootScope.games.active_game.participant2_name = response.data.participant1_name;
                          $rootScope.games.active_game.participant2_team = response.data.participant1_team;
                          $scope.getSummonerbyID(response.data.participant1);
                        } else {
                          $rootScope.games.active_game.participant1 = response.data.participant1
                          $rootScope.games.active_game.participant2 = response.data.participant2
                          $rootScope.games.active_game.participant1_name = response.data.participant1_name;
                          $rootScope.games.active_game.participant1_team = response.data.participant1_team;
                          $rootScope.games.active_game.participant2 = response.data.participant2;
                          $rootScope.games.active_game.participant2_name = response.data.participant2_name;
                          $rootScope.games.active_game.participant2_team = response.data.participant2_team;
                          $scope.getSummonerbyID(response.data.participant2);
                        }
                        $rootScope.games.active_game.adjust_factor = response.data.adjust_factor;
                        $rootScope.games.active_game.winner = response.data.winner;
                        $rootScope.games.active_game.firstturret = response.data.firstturret;
                        $rootScope.games.active_game.firstblood = response.data.firstblood;
                        $rootScope.games.active_game.game_mode = response.data.game_mode;
                        $rootScope.games.active_game.match_id = response.data.match_id;
                        $rootScope.games.active_game.game_id = response.data.game_id;
                        $rootScope.games.active_game.ratings = response.data.ratings;
                        $rootScope.games.active_game.rating_delta = response.data.rating_delta;
                        $rootScope.games.active_game.champion_ids = response.data.champion_ids;
                        $rootScope.games.active_game.create_time = response.data.create_time;
                        $rootScope.games.active_game.created_by = response.data.created_by;
                        $rootScope.games.active_game._id = response.data._id;

                        $scope.submitLS('active_game', $rootScope.games.active_game);
                    }

                });
            } else {
                return
            }
        };


        $scope.getGames = function() {
          SLapi.User.getGames().then(function(response){
            $rootScope.allGames = response.data;
          });
        }
        //function used to get Summoner's data from Riot API, with region and summoner_name
        $scope.getSummoner = function(data) {
            //unpacking data
            var player_name = data.name;
            var tag = data.tag;
            console.log(player_name);
            SLapi.User.getSummoner(data).then(function(response) {
                //NOTE: need a fucntion to check validity of the response.
                //and prompt user if it's a bad request
                // console.log(response.data); //debug
                if (response.data.result !== "failure") {
                    $scope.players[tag].info = response.data.info;
                    $scope.players[tag].ranked = response.data.ranked;
                    ngNotify.set('Summoner ' + data.name + ", we have located your profile! fetching data..", "success");
                    $scope.submitLS('player' + [tag], $scope.players[tag]);
                } else if (response.data.result === "failure" || !response.data.ranked) {
                    ngNotify.set('Running into issue getting your ranked data! Have you played [Ranked Games] this season?!', "warn");
                } else {
                    ngNotify.set('Summoner ' + data.name + ", we can't find you anywhere! You sure about [name] and [region]?", "warn");
                };
                // SLapi.User.getRating({
                //     id: $scope.players[tag].id,
                //     region: 'NA'
                // }).then(function(response) {
                //     if (response.data.result === "failure" || !response.data) {
                //         ngNotify.set('Running into issue getting your ranked data! Have you played [Ranked Games] this season?!', "warn");
                //         // ngNotify.set('Fetched more data!');
                //     } else {
                //         $scope.players[tag].ranked = response.data;
                //         $scope.submitLS('player' + [tag], $scope.players[tag]);
                //     }
                // });
            });
        };
        //function used to get Summoner's data from Riot API, with summoner_id
        $scope.getSummonerbyID = function(data) {
          console.log(data);
            SLapi.User.getSummonerbyID(data).then(function(response) {
                $scope.players[1] = response.data;
            });
        };
        //function used to verify Summoner's Runes page
        $scope.verifySummoner = function(data) {
            var tag = data.tag;
            SLapi.User.verifySummoner(data).then(function(response) {
                if (response.data.result === "success") {
                    $scope.players[tag].verified = true;
                    $scope.submitLS('player' + [tag], $scope.players[tag]);
                    ngNotify.set('Summoner ' + data.name + " has been successfully verified!", "success");
                    $scope.createSummoner(tag);
                } else {
                    ngNotify.set('Summoner ' + data.name + " we can't find you anywhere! Have you set your first runes page to 'solome' yet?", "warn");
                }
            });
        };
        //function used to delete a Summoner locally from local storage and scope
        $scope.deleteSummoner = function(data) {
            $scope.players[data].info.name = "";
            $scope.players[data].info.id = "";
            $scope.players[data].info.summonerLevel = "";
            $scope.players[data].info.profileIconId = "";
            $scope.players[data].info.revisionDate = "";
            $scope.players[data].verified = false;
            $scope.players[data].ranked = ""
            $scope.players[data].solo = "";
            $scope.removeLS('player' + [data]);
            $scope.removeLS('active_game');
        };
        //function used to check client & server connection
        $scope.getStatus = function() {
            SLapi.User.getStatus().then(function(response) {
                if (response.data.result === "success") {
                    $scope.status = "connected"
                }
            });
        };

        //-------------------Misc APIs section----------------------
        //fucntion used to determine whether to populate data from localstorage.
        $scope.udpateLS = function() {
            var player0_LS = $scope.getLS('player0');
            var player1_LS = $scope.getLS('player1');
            var firstTime = $scope.getLS('firstTime');
            if (!!player0_LS) {
                $scope.players[0] = player0_LS
            };
            if (!!player1_LS) {
                $scope.players[1] = player1_LS
            };
            // if(firstTime == null){
            //     $rootScope.modal = true;
            // };
        };
        //fucntion used to close the verification modal helper.
        $rootScope.closeModal = function() {
            // alert('triggered');
            $rootScope.modal = false;
            // $scope.submitLS('firstTime',false);
        };
        //fucntion used to close the modal permanantly.
        $rootScope.neverShow = function() {
            //  alert('triggered');
            $rootScope.modal = false;
            $scope.submitLS('firstTime', false);
        };



        $scope.match = function() {
          $rootScope.wait = true;
          var summoner = $scope.players[0].solo;
          var id = summoner.summoner_id;
          var mmr = summoner.rating;
          var name = summoner.name;
          var data = {
            mmr: mmr,
            id: id,
            name: name
          };
            SLapi.User.match(data).then(function(response){
            if(response.data.result === 'wait') {
              var promise = $interval(function(){
                  SLapi.User.matchUpdate(id).then(function(resp){
                    if (resp.data.result == 'matched'){
                      var gameData = resp.data.data;
                      $scope.getGame(gameData.gameID);
                      $rootScope.wait = false;
                      // $scope.setStep('3');
                      window.location.href = "#/games/" + gameData.gameID
                      $interval.cancel(promise);
                    } else {
                      console.log('wait');
                    }
                  })
              }, 5000);
            } else if (response.data.result == 'matched') {
              $rootScope.wait = false;
              var gameData = response.data.data;
              $scope.getGame(gameData.gameID);
              window.location.href = "#/games/" + gameData.gameID
            } else {
              console.log(response.data.message);
            }
          });
        }




        //-------------------Interval/loop section----------------------

        // $rootScope.games.active_game = $scope.getLS('active_game');
        // $rootScope.games.my_game = $scope.getLS('my_game');
        $rootScope.button = $scope.getLS('button');
        $scope.getGames();
        $scope.getGame($rootScope.games.active_game.game_id);
        $scope.getStatus();
        $scope.udpateLS();

        $interval(function() {
            $scope.getGames();
            $scope.getStatus();
            $scope.getGame($rootScope.games.active_game.game_id);
        }, 30000);
    }
]);
