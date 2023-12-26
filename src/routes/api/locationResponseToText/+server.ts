import { OPEN_AI_API_KEY } from "$env/static/private";
import type { RequestEvent } from "../$types";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPEN_AI_API_KEY,
});

export async function POST(requestEvent: RequestEvent): Promise<Response> {
  try {
    const { userInput, locationResponse } = await requestEvent.request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
      stream: true,
      messages: [
        {
          role: "system",
          content: `
        You will be given a prompt and a JSON response related to it.
        You need to sum those up in a human readable form in HTML.
        Need only the body of the html, do not include head, title, etc.
        This will be rendered unsafely in a browser, so make sure to not include any scripts to prevent XSS.
        Assume the content will be displayed on a muted light gray background.
        Include styles inline and do not include external stylesheets. Styling should be minimalistic and professional.
        Do not include any custom fonts.
        If there are any lists, they should be styled in a bullet format.
        `,
        },
        {
          role: "user",
          content: `
        Prompt: ${userInput}
        JSON: ${locationResponse}
        `,
        },
      ],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(
            encoder.encode(chunk.choices[0]?.delta?.content || "")
          );
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "content-type": "text/event-stream",
      },
    });
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
