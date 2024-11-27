"use client"; 
import "@blocknote/core/fonts/inter.css";
import { BasicTextStyleButton, BlockTypeSelect, ColorStyleButton, CreateLinkButton, DefaultReactSuggestionItem, FileCaptionButton, FileReplaceButton, FormattingToolbar, FormattingToolbarController, getDefaultReactSlashMenuItems, NestBlockButton, SuggestionMenuController, TextAlignButton, UnnestBlockButton, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Block, BlockNoteEditor, filterSuggestionItems, PartialBlock } from "@blocknote/core";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import {useEdgeStore} from "@/lib/edgestore"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AskAi from "./AskAi";
import {useTheme} from "next-themes"
interface EditorProps{
 
    initialContent?:string
    editable?:boolean
    id:Id<"documents">
}
export const Editor = ({initialContent,editable,id}:EditorProps) => {
    const {resolvedTheme} = useTheme()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    // const [blocks, setBlocks] = useState<Block[]>([]);
    const {edgestore} = useEdgeStore()
    const handleUpload = async(file:File) => {
        const response = await edgestore.publicFiles.upload({
            file
        })
        return response.url
    }
   
    const update = useMutation(api.documents.update)
    const editor = useCreateBlockNote({
        initialContent:initialContent ? JSON.parse(initialContent) as PartialBlock[] : undefined,
        uploadFile:handleUpload
    });
    const onChange = () => {
        // Converts the editor's contents from Block objects to Markdown and store to state.
        const markdown = editor.document
        update({
            id:id,
            content:JSON.stringify(markdown,null,2)
        })
    };
    const handleGenerate = async () => {
      setLoading(true);
      setError(null);
      setResponse(null);
      try {
          // const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
          // const genAI = new GoogleGenerativeAI(apiKey);
  
          // const model = genAI.getGenerativeModel({
          //     model: "gemini-1.5-flash", 
          // });

          // const generationConfig = {
          //     temperature: 1,
          //     topP: 0.95,
          //     topK: 40,
          //     maxOutputTokens: 8192,
          //     responseMimeType: "text/plain",
          // };
  
          // const chatSession = model.startChat({
          //     generationConfig,
          //     history: [],
          // });
  
          // const result = await chatSession.sendMessage(inputText);
          // const finalResult = await result.response.text();
          // setResponse(finalResult);
          const res = await fetch("/api/generateAI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputText }),
          });
          const data = await res.json();

          if (res.ok) {
              setResponse(data.response);
          } else {
              setError("Failed to generate content.");
          }
      } catch (err) {
          setError("Failed to generate content. Please try again.");
      } finally {
          setLoading(false);
      }
  };
  const handleAccept = async () => {
    if (response) {
        const currentBlock = editor.getTextCursorPosition().block;
        const markdownToBlock = await editor.tryParseMarkdownToBlocks(response);
        editor.replaceBlocks([currentBlock?.id], markdownToBlock);
        setIsModalOpen(false);
        setResponse(null)
    }
};
    const insertAi = (editor: BlockNoteEditor) => ({
        title: "Generate AI",
        onItemClick: () => {
          setIsModalOpen(true)
        },
        aliases: ["insertai", "iai"],
        group: "Others",
        subtext: "Enter a block created by AI",
    });
    const getCustomSlashMenuItems = (
        editor: BlockNoteEditor
      ): DefaultReactSuggestionItem[] => [
        ...getDefaultReactSlashMenuItems(editor),
        insertAi(editor)
    ];
 
  // Renders the editor instance using a React component.
    return (
    <>
    <BlockNoteView theme={resolvedTheme === "dark" ? "dark" : "light"} editor={editor} editable={editable} onChange={onChange} slashMenu={false} formattingToolbar={false}
    // onSelectionChange={() => {
    //     const selection = editor.getSelection();
    //     if (selection !== undefined) {
    //       setBlocks(selection.blocks);
    //     } else {
    //       setBlocks([editor.getTextCursorPosition().block]);
    //     }
    //   }}
    >
        <SuggestionMenuController
        triggerCharacter={"/"}
        // Replaces the default Slash Menu items with our custom ones.
        getItems={async (query) =>
          filterSuggestionItems(getCustomSlashMenuItems(editor), query)
        }
        />
        <FormattingToolbarController
        formattingToolbar={() => (
          <FormattingToolbar>
            <BlockTypeSelect key={"blockTypeSelect"} />
 
            <FileCaptionButton key={"fileCaptionButton"} />
            <FileReplaceButton key={"replaceFileButton"} />
            <AskAi key={"customButton"}/>
            <BasicTextStyleButton
              basicTextStyle={"bold"}
              key={"boldStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"italic"}
              key={"italicStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"underline"}
              key={"underlineStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"strike"}
              key={"strikeStyleButton"}
            />
            <BasicTextStyleButton
              key={"codeStyleButton"}
              basicTextStyle={"code"}
            />
 
            <TextAlignButton
              textAlignment={"left"}
              key={"textAlignLeftButton"}
            />
            <TextAlignButton
              textAlignment={"center"}
              key={"textAlignCenterButton"}
            />
            <TextAlignButton
              textAlignment={"right"}
              key={"textAlignRightButton"}
            />
 
            <ColorStyleButton key={"colorStyleButton"} />
 
            <NestBlockButton key={"nestBlockButton"} />
            <UnnestBlockButton key={"unnestBlockButton"} />
 
            <CreateLinkButton key={"createLinkButton"} />
          </FormattingToolbar>
        )}
    />
    </BlockNoteView>
    <Dialog open={isModalOpen} onOpenChange={() => setIsModalOpen(false)}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Generate Content</DialogTitle>
        </DialogHeader>
        <div>
            {!response && !error && (
                <Input 
                    placeholder="Enter text..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)} 
                    disabled={loading}
                />
            )}
            {error && <p className="text-red-500">{error}</p>}
            {response && (
                <textarea
                    className="w-full h-40 border rounded p-2"
                    value={response}
                    readOnly
                />
            )}
        </div>
        <DialogFooter>
            {error && (
              <Button onClick={()=>{
                setError(null)
              }}>Retry</Button>
            )}
            {!response && !error && (
                <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate"}
                </Button>
            )}
            {response && (
                <>
                    <Button onClick={handleAccept}>Accept</Button>
                    <Button onClick={handleGenerate}>Regenerate</Button>
                </>
            )}
        </DialogFooter>
    </DialogContent>
</Dialog>

    </>
    )
}
