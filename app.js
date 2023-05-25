const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
// get method

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      player_id As playerId,
      player_name As playerName
    FROM
      player_details;`;

  const players = await db.all(getPlayersQuery);
  response.send(players);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
   SELECT
      player_id As playerId,
      player_name As playerName
    FROM
      player_details;
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

// put method
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
       player_name =  '${playerName}',
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get method
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
   SELECT
      *
    FROM
      match_details;
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(match));
});

//get method
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
   SELECT
	    *
	    FROM player_match_score NATURAL JOIN match_details
        WHERE player_id=${playerId};`;
  const match = await db.all(getPlayerMatchesQuery);
  response.send(
    match.map((eachObject) => convertDbObjectToResponseObject(eachObject))
  );
});

//get method
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	SELECT
	    player_details.player_id AS playerId,
	    player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerDetails = await db.all(getMatchPlayersQuery);
  response.send(playerDetails);
});

//get method
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScore = await db.all(getPlayerScored);
  response.send(playerScore);
});

module.exports = app;
