const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // Add axios for API requests
const express = require('express'); // Use Express for your backend

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Function to parse the CSV file
const parseCSV = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return Papa.parse(fileContent, { header: true }).data; // Parse CSV data into an array of objects
};

// Function to interact with Gemini API and generate trivia questions
const generateTriviaQuestion = async (highlightData) => {
  const apiKey = 'AIzaSyB02haLReTYIP13UjQ8IG1874NAzm7RS_k'; // Replace with your Gemini API key
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Generate a simple trivia question based on the following MLB highlight data: ${JSON.stringify(highlightData)}. Include answer choices (A, B, C, D).`;

  try {
    const result = await model.generateContent(prompt);
    const triviaData = result.response.text(); // Assuming the response contains the question and options
    return triviaData;
    
    
  } catch (error) {
    console.error('Error generating trivia question:', error);
    return null;
  }
};

// Function to process multiple CSV files and generate trivia questions for each highlight
const processMultipleCSVFilesForTrivia = async (csvFiles) => {
  for (const filePath of csvFiles) {
    const data = parseCSV(filePath);

    for (const row of data) {
      const triviaQuestion = await generateTriviaQuestion(row);
      if (triviaQuestion) {
        console.log(`Generated Trivia Question for Highlight: ${row['Player']} (${row['Year']})`);
        console.log('Question:', triviaQuestion);
        console.log('---');
      } else {
        console.log('Failed to generate question for this highlight');
      }
    }
  }
};

// Fetch live MLB game data
const fetchLiveGameData = async (gamePk) => {
  const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;

  try {
    const response = await axios.get(url);
    const gameData = response.data;

    // Extract and return desired information
    return {
      gameStatus: gameData.gameData.status.abstractGameState,
      homeTeam: gameData.gameData.teams.home.teamName,
      awayTeam: gameData.gameData.teams.away.teamName,
      currentInning: gameData.liveData.linescore.currentInning,
      homeScore: gameData.liveData.linescore.teams.home.runs,
      awayScore: gameData.liveData.linescore.teams.away.runs,
    };
  } catch (error) {
    console.error('Error fetching live game data:', error);
    return null;
  }
};

// Define an endpoint to get live game data
app.get('/api/live-game/:gamePk', async (req, res) => {
  const { gamePk } = req.params;

  const liveGameData = await fetchLiveGameData(gamePk);
  if (liveGameData) {
    res.json(liveGameData);
  } else {
    res.status(500).json({ error: 'Failed to fetch live game data' });
  }
});

// Define the CSV file paths
const csvFiles = [
  path.join(__dirname, 'assets', '2016-mlb-homeruns.csv'),
  path.join(__dirname, 'assets', '2017-mlb-homeruns.csv'),
  path.join(__dirname, 'assets', '2024-mlb-homeruns.csv'),
];

// Run the trivia generation process
processMultipleCSVFilesForTrivia(csvFiles);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
