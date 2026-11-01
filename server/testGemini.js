// server/testGemini.js  (temporary: delete after testing)
import "dotenv/config";
import { generateMystery } from "./services/geminiService.js";

try {
  const m = await generateMystery("A stolen violin at a village concert", "easy");
  console.log("SUCCESS:", m.title);
  console.log(`${m.suspects.length} suspects, ${m.clues.length} clues, ${m.hints.length} hints`);
} catch (error) {
  console.log("FAILED:", error.code || "", error.message);
}
process.exit(0);