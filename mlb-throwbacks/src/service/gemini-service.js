const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI("AIzaSyB02haLReTYIP13UjQ8IG1874NAzm7RS_k");

// Function to analyze data using Gemini
async function analyzeDataWithGemini(data) {
  try {
    const prompt = `Analyze the following data and generate trivia questions: ${JSON.stringify(data)}`;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error with Gemini API:", error.message);
    throw error;
  }
}

module.exports = { analyzeDataWithGemini };
