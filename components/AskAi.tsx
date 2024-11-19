import { useBlockNoteEditor } from "@blocknote/react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AskAi() {
  const editor = useBlockNoteEditor();
  // Function to handle the actions when menu items are clicked
  const handleAction = async(action:String) => {
    const browserSelection = window.getSelection();
    const apiKey = process.env.GOOGLE_API_KEY!
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // or whatever model you want to use
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
    // Sending the selected text to Gemini AI for correction
    const selection = editor.getSelection()
    const markdownOfSelection = await editor.blocksToMarkdownLossy(selection?.blocks)
    console.log(markdownOfSelection)
    let prompt = ""
    if(action == "grammar"){
      prompt += "Fix the grammar in following while maintaining markdowns : " + markdownOfSelection
    }
    if(action == "formal"){
      prompt += "Write the following in formal language while maintaining markdowns : " + markdownOfSelection
    }
    if(action == "short"){
      prompt += "Summarize the following while maintaining markdowns : " + markdownOfSelection
    }
    if(action == "long"){
      prompt += "Expand the following while maintaining markdowns : " + markdownOfSelection
    }
    const result = await chatSession.sendMessage(prompt);
    const finalResult = result.response.text()
    const ids = [];

    if (selection?.blocks) {
      for (const obj of selection.blocks) {
          ids.push(obj.id); // Add the id to the ids array
      }
  }
  
    const markdownToBlock = await editor.tryParseMarkdownToBlocks(finalResult);
    editor.replaceBlocks(ids, markdownToBlock)
    
}

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Ask AI</DropdownMenuTrigger>
      <DropdownMenuContent>

        <DropdownMenuItem onSelect={() => handleAction('grammar')}>Fix grammar</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction('formal')}>Make it formal</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction('short')}>Make it shorter</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleAction('long')}>Make it longer</DropdownMenuItem>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
