import { config } from "../config/config.js";
import { ChatMistralAI } from "@langchain/mistralai";
import { SystemMessage,HumanMessage } from "@langchain/core/messages";
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

    const prompt=new SystemMessage(`${SYSTEM_PROMPT}`);
    const humanMessage = new HumanMessage(`Process the following batch of records: ${JSON.stringify(batch)}`);

    const response=await structuredLLM.invoke([prompt, humanMessage]);

    return response;

}