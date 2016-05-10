var app = angular.module('soloMe', [
  'ui.router',
  'ngNotify',
  'ngAnimate',
  'angular-loading-bar',
  'LocalStorageModule',
  'angularMoment'
  // 'ui.bootstrap'
]);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('init', {
                url: '/init',
                templateUrl: 'views/init.html',
                controller: 'MainCtrl'
            })

            .state('create', {
                url: '/create',
                templateUrl: 'views/create.html',
                controller: 'MainCtrl'
            })

            .state('games', {
                url: '/games/{id}',
                templateUrl: 'views/game.html',
                controller: 'MainCtrl',
                resolve: {
                  game: ['$stateParams', 'games', function($stateParams, games) {
                    return games.get($stateParams.id);
                  }]
                }
            })

            .state('join', {
                url: '/games/{id}/join',
                templateUrl: 'views/join.html',
                controller: 'MainCtrl',
                resolve: {
                  game: ['$stateParams', 'games', function($stateParams, joinGame) {
                    return games.get($stateParams.id);
                  }]
                }
            });


        $urlRouterProvider.otherwise('init');
    }
]);

app.config(function (localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('soloMe');
});

app.filter('isempty', function() {
    return function(input) {
        return isEmpty(input) ? 'waiting..' : input;
    };

    function isEmpty (i){
        return (i === null || i === undefined || !i);
    }
});
