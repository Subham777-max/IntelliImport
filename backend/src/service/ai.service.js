import { config } from "../config/config.js";
import { ChatMistralAI } from "@langchain/mistralai";
import { SystemMessage } from "@langchain/core/messages";
import { BatchResponseSchema } from "../llm/schema/crm.schema.js";

import { SYSTEM_PROMPT } from "../llm/prompts/crm.prompt.js";

const llm = new ChatMistralAI({

    apiKey: config.MISTRAL_API_KEY,

    model: "mistral-large-latest",

    temperature: 0

});

const structuredLLM = llm.withStructuredOutput(
    BatchResponseSchema
);

export async function processBatch(batch){

    const prompt=new SystemMessage(`

${SYSTEM_PROMPT}

Rows:

${JSON.stringify(batch)}

`);

    const response=await structuredLLM.invoke(prompt);

    return response;

}