
NOTE: TEST 2 API endpoint /public/summoner/data
curl -d '{"id":24894460, "region":"NA"}' -H "Content-Type: application/json" http://localhost:3000/public/summoner/data

NOTE: TEST 3 API endpoint /public/summoner/verify
curl -d '{"name":"JasonStathan", "region":"NA"}' -H "Content-Type:application/json" http://localhost:3000/public/summoner/verify

NOTE: TEST 4 API endpoint /games/create
curl -d '{"create_time":"Tue May 06 2016 04:05:36 GMT-0400 (EDT)", "game_mode":"normal", "participant1":24894420, "status":"open", "rating":1200}' -H "Content-Type:application/json" http://localhost:3000/games/create

curl -d '{"create_time":"Tue May 03 2016 23:44:36 GMT-0400 (EDT)", "game_mode":"normal", "participant1":24894460, "status":"open", "rating":[1200]}' -H "Content-Type:application/json" http://localhost:3000/games/create

"ratings":{24894461:1200}

NOTE: TEST 5 API endpoint /games
http://localhost:3000/games

NOTE: TEST 5 API endpoint /games/:game_id
http://localhost:3000/games/2

NOTE: TEST 6 API endpoint /lastGame
http://localhost:3000/lastGame

NOTE: TEST 7 API endpoint /summoners
http://localhost:3000/summoners

NOTE: TEST 8 API endpoint /lastSummoner
http://localhost:3000/lastSummoner

NOTE TEST 10 API endpoint /summoners/:summoner_id
http://localhost:3000//summoners/:25319842


//!res.body.status || !res.body.game_mode || !res.body.participants || !res.body.create_time

NOTE: TEST 9 API endpoint /createSummoner
curl -d '{"region":"na", "summoner_id":25319842, "summoner_name":"StopTV", "verified":true, "total_win": 0, "total_lose":0, "games": ['']}' -H "Content-Type:application/json" http://localhost:3000/summoners/create

curl -d '{"summoner_id":76850616,"rating":1200, "name":"KerberosLas"}' -H "Content-Type:application/json" http://localhost:3000/games/1gjd4880tfy80k/join
