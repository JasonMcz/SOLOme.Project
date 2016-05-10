app.factory('SLapi', ['$http', '$window', function($http, $window) {


    var urlAuthed = "*********";
    var url = "http://localhost:3000/";

    var SLapi = SLapi || {};

    SLapi = {};

    SLapi.User = {
        //*params LIST: 'first_name', 'last_name', 'dob', 'cell', 'addr_street', 'addr_city', 'addr_state', 'addr_zip'//

        createGame: function(data) {
            return $http({
                method: "POST",
                url: url + "games/create",
                dataType: "application/json",
                data: data
            });
        },

        getGame: function(gameid) {
            return $http({
                method: "GET",
                url: url + "games/" + gameid,
                dataType: "application/json"
            });
        },

        getGames: function(data) {
            return $http({
                method: "GET",
                url: url + "games",
                dataType: "application/json"
            });
        },

        createSummoner: function(data) {
            return $http({
                method: "POST",
                url: url + "summoners/create",
                dataType: "application/json",
                data: data
            });
        },

        findSummoner: function(data) {
          return $http({
              method: "GET",
              url: url + "/summoner/" + data.id,
              dataType: "application/json",
          });
        },

        getSummoner: function(data) {
            return $http({
                method: "POST",
                url: url + "public/summoner/data",
                dataType: "application/json",
                data: {
                    name: data.name,
                    region: data.region,
                }
            });
        },

        getSummonerbyID: function(data) {
            return $http({
                method: "GET",
                url: url + "public/summoner/" + data +"/data",
                dataType: "application/json",
            });
        },

        verifySummoner: function(data) {
            return $http({
                method: "POST",
                url: url + "public/summoner/verify",
                dataType: "application/json",
                data: {
                    name: data.name,
                    region: data.region,
                }
            });
        },

        // getRating: function(data) {
        //     return $http({
        //         method: "POST",
        //         url: url + "public/summoner/data",
        //         dataType: "application/json",
        //         data: {
        //             id: data.id,
        //             region: data.region,
        //         }
        //     });
        // },

        getStatus: function() {
            return $http({
                method: "POST",
                url: url + "status",
                dataType: "json",
                data: {

                }
            });
        },

        match: function(summoner) {
          return $http({
            method: "POST",
            url: url + "match",
            dataType: "application/json",
            data: {
              summoner: summoner
            }
          })
        },
        matchUpdate: function(summonerID) {
          return $http({
            method: "POST",
            url: url + "match/update",
            dataType: "json",
            data: {
              id: summonerID
            }
          })
        }

    }

    return SLapi;

}]);
