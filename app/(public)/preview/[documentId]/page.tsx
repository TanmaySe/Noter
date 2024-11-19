"use client"

import { Cover } from "@/components/cover"
import { Editor } from "@/components/editor"
import { Toolbar } from "@/components/toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"

interface DocumentIdPageProps{
    params:{
        documentId:Id<"documents">
    }
}
const DocumentIdPage = ({params}:DocumentIdPageProps) => {

    const document = useQuery(api.documents.getByIdPreview,{
        documentId:params.documentId
    })
    
    if(document === undefined){
        return (
            <div>
                <Cover.Skeleton/>
                <div className="md:max-w-3xllg:max-w-4xl mx-auto mt-10">
                    <div className="pl-8 space-y-4 pt-4">
                        <Skeleton className="h-14 w-[50%]"/>
                        <Skeleton className="h-4 w-[80%]"/>
                        <Skeleton className="h-4 w-[40%]"/>
                        <Skeleton className="h-4 w-[60%]"/>
                    </div>
                </div>
            </div>
        )
        
    }
    if(document === null){
        return (
            <div>Not Found</div>
        )
    }
    return(
        <div className="pb-40">
            <Cover preview url={document.coverImage}/>
            <div className="md:max-w-3xl lg:max-w-4xl max-auto">
                <Toolbar preview initialData={document}/>
                <Editor editable={false} initialContent={document.content} id={params.documentId}/>
                
            </div>
        </div>
    )
}

export default DocumentIdPage