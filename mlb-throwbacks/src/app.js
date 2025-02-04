require('dotenv').config();

const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const express = require('express');
const { Console } = require('console');
const cors = require('cors');
const gemapi_key = process.env.GEMINI_API_KEY;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
consol



// Function to parse the CSV file
const parseCSV = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return Papa.parse(fileContent, { header: true }).data;
};


const fetchMostRecentGames = async () => {
  let currentDate = new Date(); // Start from today
  let formattedDate = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  let gameDays = new Set(); // To track unique game dates
  let mappedGames = [];

  while (gameDays.size < 4) { // Stop after collecting 4 unique game days
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${formattedDate}`;
    //console.log(`Checking games for: ${formattedDate}`);

    try {
      const response = await axios.get(url);
      if (response.data.dates && response.data.dates.length > 0) {
        const games = response.data.dates.flatMap((date) => date.games);

        if (games.length > 0) {
          gameDays.add(formattedDate); // Track unique game dates
          mappedGames.push(...games.map((game) => ({
            gamePk: game.gamePk,
            gameDate: game.gameDate,
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            status: game.status.detailedState,
            awayTeamId: game.teams.away.team.id,
            homeTeamId: game.teams.home.team.id,
            venue: game.venue.name,
            videoLink: game.content?.link || "No video available",
          })));
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error.message);
    }

    // Move back one day and try again
    currentDate.setDate(currentDate.getDate() - 1);
    formattedDate = currentDate.toISOString().split('T')[0];
  }

  //console.log(`Fetched games from the most recent 4 days:`, mappedGames);
  return mappedGames;
};

//fetchMostRecentGames();



// Function to interact with Gemini API and generate a single trivia question
/*const generateTriviaQuestion = async (highlightData) => {
  const apiKey = 'AIzaSyB02haLReTYIP13UjQ8IG1874NAzm7RS_k'; // Replace with your Gemini API key
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Generate a simple trivia question based on the following MLB highlight data: ${JSON.stringify(highlightData)}. Include answer choices (A, B, C, D).`;

  try {
    const result = await model.generateContent(prompt);
    const triviaData = result.response.text();
    return triviaData;
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return null;
  }
};*/




// Function to fetch games data for the past 5 days and current games

// Removed duplicate fetchMostRecentGames function

//fetchMostRecentGames();

const fetchVideoContent = async () => {
  const games = await fetchMostRecentGames(); // Fetch games

  if (!games || games.length === 0) {
    console.log('No games available to fetch video content for.');
    return [];
  }

  let videos = []; // Store video content for all games

  for (const game of games) {
    const gamePk = game.gamePk; // Extract gamePk for each game
    console.log(`Fetching video content for gamePk: ${gamePk}`);

    const videoUrl = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;

    try {
      const response = await axios.get(videoUrl);
      const media = response.data.media?.epgAlternate?.[1]?.items?.[0]?.playbacks?.[5];

      if (media) {
        videos.push({
          gamePk,
          gameDate: game.gameDate,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          videoUrl: media.url, // Extract video URL
          quality: media.name, // Quality information (e.g., 720p)
        });
      } else {
        console.log(`No media content available for gamePk: ${gamePk}`);
      }
    } catch (error) {
      console.error(`Error fetching video content for gamePk ${gamePk}:`, error);
    }
  }

  console.log('Fetched video content:', videos);
  return videos; // Return all collected video content
};

//fetchVideoContent();



// Function to fetch detailed player stats for a specific game
const fetchPlayerStats = async (gamePk) => {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;

  try {
    const response = await axios.get(url);
    //console.log('performance babatunde:', response.data);
    //console.log('API Response for top performer test:', response.data.topPerformers[2].player.stats);
    // Check if topPerformers data exists in the response
    if (response.data && response.data.topPerformers) {
      const performers = response.data.topPerformers.map((performer) => {
        const playerName = performer.player.person ? performer.player.person.fullName : 'Unknown Player';
        const jerseyNumber = performer.player.jerseyNumber || 'No Jersey Number';
        const position = performer.player.position ? performer.player.position.name : 'Unknown Position';
        const battingOrder = performer.player.stats?.batting || 'No Batting Order';
        const pitchingOrder = performer.player.stats?.pitching || 'No Pitching Order';
        const fieldingOrder = performer.player.stats?.fielding || 'No Fielding Order';
        const seasonStats = performer.player.seasonStats || 'No Season Stats';
        const teamId = performer.player.parentTeamId || null;

        return {
          name: playerName,
          type: performer.type,
          gameScore: performer.gameScore,
          hittingGameScore: performer.hittingGameScore,
          jerseyNumber: jerseyNumber,
          position: position,
          stats: performer.player.stats,
          battingOrder,
          pitchingOrder,
          fieldingOrder,
          playerId: performer.player.person?.id || null, // Ensure playerId is extracted
          teamId: teamId, // Ensure teamId is extracted
          
        };
      });
      //console.log('Top Performers:', performers);
      return performers;
    } else {
      console.log('Top Performers data is not available.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
};
//fetchPlayerStats(775294)

const loadRecentGameStats = async () => {
  const recentGames = await fetchMostRecentGames();
  
  for (const game of recentGames) {
    const gamePk = game.gamePk;  // Get the gamePk from the recent games
    const playerStats = await fetchPlayerStats(gamePk); // Fetch the player stats using the gamePk
    console.log(`Player Stats for Game ${gamePk}:`, playerStats);
  }
};

// Call the function to load recent game stats
loadRecentGameStats();

// Function to fetch historical records for a specific metric
const fetchHistoricalRecords = async (metric, playerId, teamId, option) => {
  //let url;
  const url = `https://statsapi.mlb.com/api/v1/teams/111/stats?stats=season&group=hitting,pitching,fielding`;    
  const response = await axios.get(url);
  console.log('teammmm stats Response:', response.data.stats[0].splits[0]);
  return response.data;
}
  /*switch (option) {
    case 'player':
      url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=career`;
      break;
    case 'team':
      const currentYear = new Date().getFullYear(); // Get the current year
      url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&season=${currentYear}`;
      break;
    case 'mlb':
      url = `https://statsapi.mlb.com/api/v1/stats?stats=career&group=hitting&playerPool=ALL`;
      break;
    default:
      return null;
  }

  console.log(`Fetching historical records from URL: ${url}`);

  try {
    const response = await axios.get(url);
    //console.log('API Response:', response.data); // Log the response for debugging

    const stats = response.data.stats[0]?.splits || [];
    console.log('Stats:', stats); // Log the stats array

    if (stats.length === 0) {
      console.log('No stats found for the given option.');
      return null;
    }

    // Find the best record for the metric
    const bestRecord = stats.reduce((best, record) => {
      return record.stat[metric] > best.stat[metric] ? record : best;
    }, { stat: { [metric]: 0 } });

    // Check if the metric exists in the best record
    if (!bestRecord.stat[metric]) {
      console.log(`Metric "${metric}" not found in the stats.`);
      return null;
    }

    return bestRecord;
  } catch (error) {
    console.error('Error fetching historical records:', error);
    return null;
  }
};*/

// Function to compare stats and generate trivia questions
const compareStats = async (playerStats, option) => {
  const comparisons = [];

  //console.log(`Comparing stats for option: ${option}`);
  //console.log(`Player ID: ${playerStats.playerId}, Team ID: ${playerStats.teamId}`);

  // Skip if playerId or teamId is missing
  if (option === 'player' && !playerStats.playerId) {
    console.log(`Player ID is missing for ${playerStats.name}. Skipping comparison.`);
    return comparisons;
  }
  if (option === 'team' && !playerStats.teamId) {
    console.log(`Team ID is missing for ${playerStats.name}. Skipping comparison.`);
    return comparisons;
  }

  // Identify the key metric for the player
  const keyMetric = Object.keys(playerStats.stats).reduce((a, b) =>
    playerStats.stats[a] > playerStats.stats[b] ? a : b
  );

  if (!keyMetric || !playerStats.stats[keyMetric]) {
    console.log(`No valid metric found for player: ${playerStats.name}`);
    return comparisons;
  }

  const metricValue = playerStats.stats[keyMetric];

  // Fetch historical records based on the selected option
  const historicalRecord = await fetchHistoricalRecords(
    keyMetric,
    playerStats.playerId,
    playerStats.teamId,
    option
  );

  if (historicalRecord) {
    comparisons.push({
      metric: keyMetric,
      current: metricValue,
      historicalRecord: historicalRecord.stat[keyMetric],
      historicalRecordHolder: historicalRecord.player?.fullName || historicalRecord.team?.name || 'Unknown',
      difference: metricValue - historicalRecord.stat[keyMetric],
    });

    // Generate trivia question using Gemini
    const triviaPrompt = `Generate a trivia question about ${playerStats.name}'s ${keyMetric} in comparison to ${option === 'player' ? 'their personal best' : option === 'team' ? 'their team\'s historical record' : 'MLB\'s all-time record'}.`;
    const triviaQuestion = await generateTriviaQuestion(triviaPrompt);
    comparisons.push({ triviaQuestion });
  }

  return comparisons;
};

/*const generateTriviaQuestion = async (playerStats) => {
  if (!playerStats || playerStats.length === 0) {
    console.log('No player stats available.');
    return null;
  }

  const apiKey = 'AIzaSyB02haLReTYIP13UjQ8IG1874NAzm7RS_k'; // Replace with your Gemini API key
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Format the player stats for the AI prompt
  const formattedPlayerStats = playerStats.map((performer) => {
    return {
      name: performer.name,
      type: performer.type,
      position: performer.position,
      stats: {
        batting: performer.battingOrder,
        pitching: performer.pitchingOrder,
        fielding: performer.fieldingOrder,
      },
    };
  });

  // Use the formatted player stats to create the prompt
  const prompt = `Generate a simple trivia question based on the following MLB player stats: ${JSON.stringify(
    formattedPlayerStats
  )}. Include answer choices (A, B, C, D).`;

  try {
    const result = await model.generateContent(prompt);
    const triviaData = await result.response.text(); // Ensure this is correctly accessed
    console.log('Generated Trivia Question:', triviaData); // Log response for testing
    return triviaData;
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return null;
  }
};*/

const testGeminiAI = async () => {
  const gamePk = 775294; // Replace with a valid gamePk for testing
  console.log(`Fetching player stats for gamePk: ${gamePk}`);

  // Step 1: Fetch player stats
  const playerStats = await fetchPlayerStats(gamePk);

  if (!playerStats || playerStats.length === 0) {
    console.log('No player stats found. Cannot generate trivia question.');
    return;
  }

  console.log('Player Stats:', playerStats);

  // Step 2: Generate trivia question using Gemini AI
  const triviaQuestion = await generateTriviaQuestion(playerStats);

  if (!triviaQuestion) {
    console.log('Failed to generate trivia question.');
    return;
  }

  // Step 3: Log the trivia question
  console.log('Generated Trivia Question:', triviaQuestion);
};

// Call the test function
testGeminiAI();

const generateTriviaQuestion = async (playerStats) => {
  if (!playerStats || playerStats.length === 0) {
    console.log('No player stats available.');
    return null;
  }

  const apiKey = gemapi_key;
  ; // Replace with your Gemini API key
  const genAI = new GoogleGenerativeAI(gemapi_key);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Format the player stats for the AI prompt
  const formattedPlayerStats = playerStats.map((performer) => {
    return {
      name: performer.name,
      type: performer.type,
      position: performer.position,
      stats: {
        batting: performer.battingOrder,
        pitching: performer.pitchingOrder,
        fielding: performer.fieldingOrder,
      },
    };
  });

  const prompt = `Generate three simple trivia question based on the following stats(metric based and stasts involved) for each seperate players: ${JSON.stringify(
    formattedPlayerStats
  )}. Include answer choices (A, B, C, D). Give your reponse as this format example: 
  {
  "triviaQuestion": "Who scored the most runs in this game?",
  "options": ["Player A", "Player B", "Player C", "Player D"],
  "correctAnswer": "Player B"
}`;

try {
  const result = await model.generateContent(prompt);

  // Get raw text response from Gemini API
  let rawTriviaData = await result.response.text();

  // Remove potential markdown formatting (```json ... ```)
  rawTriviaData = rawTriviaData.replace(/```json|```/g, '').trim();

  // Parse cleaned JSON
  const triviaData = rawTriviaData;

  console.log('Generated Trivia Question:', triviaData); // Log response for testing
  return triviaData;
} catch (error) {
  console.error('Error generating trivia question:', error);
  return null;
}

};

// Define an endpoint to compare stats for the most recent game
app.get('/api/compare-stats', async (req, res) => {
  try {
    const { option } = req.query; // 'player', 'team', or 'mlb'
    if (!['player', 'team', 'mlb'].includes(option)) {
      return res.status(400).json({ error: 'Invalid option. Choose "player", "team", or "mlb".' });
    }

    const gamesData = await fetchGamesData();
    if (!gamesData || gamesData.length === 0) {
      return res.status(404).json({ error: 'No recent games found' });
    }

    const mostRecentGame = gamesData[0];
    console.log('Most Recent Game:', mostRecentGame);
    const topPerformers = await fetchPlayerStats(mostRecentGame.gamePk);

    if (!topPerformers) {
      return res.status(500).json({ error: 'Failed to fetch top performers' });
    }

    // Compare stats for each top performer based on the selected option
    const comparisons = [];
    for (const performer of topPerformers) {
      const playerComparisons = await compareStats(performer, option);
      comparisons.push(...playerComparisons);
    }

    res.json({ comparisons });
  } catch (error) {
    console.error('Error handling /api/compare-stats request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await fetchVideoContent();
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch video content' });
  }
});
app.post('/api/trivia', async (req, res) => {
  const { gamepk } = req.body;

  if (!gamepk) {
    return res.status(400).json({ error: 'gamepk is required in the request body.' });
  }

  try {
    // Step 1: Fetch player stats for the given gamepk
    const playerStats = await fetchPlayerStats(gamepk);

    if (!playerStats || playerStats.length === 0) {
      return res.status(404).json({ error: 'No player stats found for the provided gamepk.' });
    }

    // Step 2: Generate trivia questions based on the player stats
    const triviaQuestion = await generateTriviaQuestion(playerStats);

    if (!triviaQuestion) {
      return res.status(500).json({ error: 'Failed to generate trivia question.' });
    }

    // Step 3: Ensure JSON format before sending response
    let triviaJson;
    try {
      triviaJson = JSON.parse(triviaQuestion); // Convert string to JSON
    } catch (parseError) {
      console.error('Error parsing trivia JSON:', parseError);
      return res.status(500).json({ error: 'Invalid trivia response format.' });
    }

    // Step 4: Return properly formatted response to frontend
    res.json({
      success: true,
      triviaQuestions: triviaJson, // Ensure it's an array/object, not a string
    });
  } catch (error) {
    console.error('Error handling /api/trivia request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});