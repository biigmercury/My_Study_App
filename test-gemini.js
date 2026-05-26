const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6J6Z78Z16ou67FeHT-_QX6WN4Jvb3g2QTA6qfvqaSdlkw");
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });
    const result = await model.generateContent("hello");
    console.log(result.response.text());
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
