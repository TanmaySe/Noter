// app/api/generateAI/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { inputText } = await req.json(); // Get inputText from the request body
        
        // Ensure inputText is provided
        if (!inputText) {
            return NextResponse.json({ error: "Input text is required." }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY!;
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", 
        });

        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        };

        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });

        const result = await chatSession.sendMessage(inputText);
        const finalResult = await result.response.text();

        // Return the generated response
        return NextResponse.json({ response: finalResult });

    } catch (err) {
        // Handle errors
        return NextResponse.json({ error: "Failed to generate content." }, { status: 500 });
    }
}
