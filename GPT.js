import * as dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const thread = await openai.beta.threads.create();
const THREAD_ID = thread.id;

async function get_top_scorers() {
  const fetch = require("node-fetch");
  const url =
    "https://api-football-v1.p.rapidapi.com/v3/players/topscorers?league=39&season=2023";
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": "2f92025d05mshac15671f542a81fp19ca86jsncff189354108",
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
  };
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(error);
  }
}

export async function get_gpt_answer(user_message) {
  const messages = await openai.beta.threads.messages.create(THREAD_ID, {
    role: "user",
    content: user_message,
  });

  const run = await openai.beta.threads.runs.create(THREAD_ID, {
    assistant_id: "asst_LbqKnmc0NenSn5aNplMoeU6v",
    instructions: "Answer with a short sentence",
  });

  let runStatus = await openai.beta.threads.runs.retrieve(THREAD_ID, run.id);

  while (runStatus.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    runStatus = await openai.beta.threads.runs.retrieve(THREAD_ID, run.id);

    if (runStatus.status === "requires_action") {
      const requiredActions =
        runStatus.required_action.submit_tool_outputs.tool_calls;

      let toolsOutput = [];

      for (const action of requiredActions) {
        const funcName = action.function.name;
        if (funcName === "get_top_scorers") {
          const output = await get_top_scorers();
          toolsOutput.push({
            tool_call_id: action.id,
            output: JSON.stringify(output),
          });
        } else {
        }
      }

      // Submit the tool outputs to Assistant API
      await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs: toolsOutput,
      });
    } else if (runStatus.status === "failed") {
      return "Je ne comprends pas vraiment ta demande";
    }
  }
  const message = await openai.beta.threads.messages.list(THREAD_ID);

  let response = message.body.data[0].content[0].text.value;
  response = await response.split("【")[0];
  return response;
}
