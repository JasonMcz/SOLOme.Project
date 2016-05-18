# SOLOme.Project

![Imgur](http://i.imgur.com/7sb8ucd.png)

“Bring the Solo fun back to League of Legends”


# Background

As a 5-year LOL veteran, I've witnessed how game dynamic has changed over the years and how its focus has shifted more and more towards the teamwork aspect of the game. In the current meta, one good team fight with a 3-4 men push can easily yield a victory before the early game phase even ends. Just seeing all my older league friends slowly departing this game because of this shift and also my love for playing solo games made me take on this project for this year’s API challenge.

<a href="http://i.imgur.com/q4u8Rg3.png"><img src="http://i.imgur.com/q4u8Rg3.png" align="center" width="70%" ></a></p>
<a href="http://i.imgur.com/osSSdFp.png"><img src="http://i.imgur.com/osSSdFp.png" align="center" width="70%" ></a>

# Introduction

SOLOme is a web based platform that allows fellow LOLers to enjoy the solo (skills) aspect of the game, whether they are challenging friends for a duo or getting matched with someone in the community, and at the same time allows them to track their solo track record. 


# Demo
 
**[Our DEMO site]**

(http://www.solome.lol/)

**[Create Game Room]**

(http://recordit.co/ocO40ds316)

**[Match with A Player]**

(http://recordit.co/QJDxNSS75p)


# Use Case

1. Summoner JasonStathan just played a blind normal game (5v5) mirror laning against enemy Zed and he thinks the opponent was pretty damn good at Zed. As a fellow Zed lover, he had sent the enemy Zed a friend request afterwards. Jason created a 1v1 game room on SoloMe platform and sent the invitation link via game chat. They started a solo game afterwards and SOLOme platform tracked that solo game's performance including who scored [first blood] or [first turret], and also the platform will track the [total win]/[total lose] for giving each player a referencing MMR.

2.  Summoner KerberosLas wanted to see how good he's playing the champion Lee Sin, he decided to use SOLOme to look for a quick pickup 1v1 match. After verify his ownership of the summoner, he clicked [Match Me] and the platform uses match engine to match him with another player who’s currently awaiting to solo someone.

3. Just for fun! Do whatever you like in a solo game! Maybe create a tournament in your school?

# How it works

![Imgur](http://i.imgur.com/cYzqNu5.jpg)

# Our Design

	Software stack: [MEAN](http://mean.io/) (Mongo, Express, Angular, Node.js).

	Server End: [Node.js](https://nodejs.org/), [Express](http://expressjs.com/).

	Debugging: Morgan as logger.

	Database: [Mongoose](http://mongoosejs.com/).

	Front-end: [Angular.js](https://angularjs.org/), [Bootstrap](http://getbootstrap.com/)

**	**

**Database Schema**

Using mongoose as interface and using mongoDB for our data persistence. 

*Below is a database schema of our models:*

<a href="http://i.imgur.com/8TuMEti.png"><img src="http://i.imgur.com/8TuMEti.png" align="center" width="60%" ></a></p>

# User Verfication Process

We are using user's runes page to achieve the verification process currently, for this version, user just need to change the 1st runes page to solome, then they are verified for being the owner of the summoner otherwise they won't be able to create or match with a game.

Future version, we envisioning connecting user with their email address then do a 2FA process, by sending them randomly generated code from server in which case needed to be entered from the front-end in order to complete the process.


# The States of Games

By using multiple API calls against League Server to achieve the shifting between the status of games. Using [Agenda](https://github.com/rschmukler/agenda) - a light-weight job scheduling library for Node.js, system is able to concurrently schedule jobs to facilitate the checking and status setting/updating against the mongo database.

![Imgur](http://i.imgur.com/O09GnPe.jpg)


# The Game Room

The gameroom function is designed to allow players to create a open game room that's available to share via a link in the format of [http://solome.lol/#games/123zxc9234k]

The other person who receives the link will be able join the game room. After both participants join the game room, scheduled job with the Node will update data in the [Games_db] from the backend, where the job runs on an designated interval to check against Riot current_game endpoint for game info.

# The Matchmaker

The matchmaker function is designed to match available people for 1v1 games according to their MMR rating calculated internally.

When we started working on the matchmaking engine, we realised how important the data structure was to handle growing volumes of users. We wanted the structure to be highly scalable, allowing for quick insertions and deletions of data.

We chose to organise the users seeking a match within a binary search tree to minimize the search for addition and deletion. 

Each node in the tree is represented as follows: 

{

	Data: {

		Mmr: this node's mmr,

		Summoner: {summoner data},

		*List: {List of all summoners within the same mmr bracket}

},

	Left: leftchild,

	Right: rightchild

}

*The list is represented by a linked list queue data structure

Below is an example of organisations of nodes according to mmr

<a href="http://i.imgur.com/fc9ElUF.png"><img src="http://i.imgur.com/fc9ElUF.png" align="center" width="45%" ></a></p>

*Note: each node represents a central value of the allowed matching bracket (i.e.: 1200 represents a bracket of min < 1200 < max within which the players actually get matched).*

As of now, since we do not need to search for a specific summoner who is in the queue, such a structure allows for best case O(log(n)) and worst case O(n) insertions and deletions in terms of mmr comparisons.

In the future, the structure could be marginally improved to handle large volumes of users by implementing rebalancing feature that makes sure that the search complexity is O(log(n)).

# The MMRs

* Goal is to allow users to be ranked along a normDist curve where top players have to win significantly more to be ranked higher

* Initial assignment is 1200.00 for everyone ( summoner  > level 30.)

* Winning/losing a solo match can affect your score in the range of [1,39] or [-39,-1] based on the difference between players mmrs.

  var calcMMR = function(MMR1, MMR2) {

    var adjustment = (Number(MMR1) - Number(MMR2)) / 20;

    var s1 = 20 - Math.min(Math.max(adjustment, -19), 20);

    return [adjustment, s1]
    
  };

# API Design

'Functions by users'

[game related functions]

-create a game          // to create a solo game, with the 'status' open

-get a game               // to get a current game, with the 'status' open

  --join a game           // to join a current game knowing the game_id

-match a game          // to get matched with someone who's currently in a game with the 'status' open

-get past games        // to get past games, with options to show opened games, in process games, and completed games

[summoner related functions]

-get summoner          // to get specific user data

-verify summoner      // to verify summoner runes page

  --create summoner  // register summoner on the server for MMR purpose

-get summoners        // to get all summoners, can be sorted by MMR, win rate and etc.

The actions map directly to several routes, which are described as follows:

<table>
  <tr>
    <td>Endpoint</td>
    <td>Method</td>
    <td>Details</td>
  </tr>
  <tr>
    <td>/game/create</td>
    <td>POST</td>
    <td>create a new game</td>
  </tr>
  <tr>
    <td>/game/:game_id</td>
    <td>GET</td>
    <td>get one game using game id</td>
  </tr>
  <tr>
    <td>/game/:game_id/join </td>
    <td>POST</td>
    <td>join one game given game id</td>
  </tr>
  <tr>
    <td>/game/match</td>
    <td>POST</td>
    <td>get matched with someone who's currently in a game with the 'status' open and no participant2</td>
  </tr>
  <tr>
    <td> /games  </td>
    <td>GET</td>
    <td>return a list of games and associated meta data</td>
  </tr>
  <tr>
    <td>/summoner/:summoner_id</td>
    <td>GET</td>
    <td>return an individual summoner with associated comments</td>
  </tr>
  <tr>
    <td>/summoner/create</td>
    <td>POST</td>
    <td>create new summoner</td>
  </tr>
  <tr>
    <td>/public/summoner/data</td>
    <td>POST</td>
    <td>return an individual summoner with associated account & ranked status
</td>
  </tr>
  <tr>
    <td>/public/summoner/verify </td>
    <td>POST</td>
    <td>return a boolean value that verifies summoner if rune page has changed
</td>
  </tr>
  <tr>
    <td>/summoners</td>
    <td>POST</td>
    <td>return all summoners which can be sorted based on ranking, win rate and etc.</td>
  </tr>
</table>


# Deployment

Requirements:

1. Node.js

2. Npm & Bower (installed globally)

3. MongoDB

To Install:

**Clone **our git and install locally

Current version allows for local usage. 

1. $ cd projectfolder

2. $ cd app

3. Before running the local server, make sure to run command **$ npm install** into the app folder.

4. $ cd public

5. $ sudo npm install

6. $ bower install (you might want to add --allow-root, if you are running sudo)


# Acknowledgement

**Team**: @[JZ](https://www.linkedin.com/in/joeczhou) 'JasonStathan' @Anik657 ‘KerberosLas’

Special Thanks to @Chris 'StopTV' who provided us ideas on calculating MMRs and match making. @[Thinkster](https://thinkster.io/mean-stack-tutorial#wiring-everything-up).io providing such an awesome tutorial for getting us to speed so quickly on MEAN stack 

