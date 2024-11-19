"use client";
import Image from "next/image"
import {useUser} from "@clerk/clerk-react"
import { Button } from "@/components/ui/button";
import { PlusCircle, Router } from "lucide-react";
import { useMutation } from "convex/react";
import {api} from "@/convex/_generated/api"
import { toast } from "sonner";
import { useRouter } from "next/navigation";
const DocumentsPage = () => {
    const router = useRouter()
    const {user} = useUser()
    const create = useMutation(api.documents.create)
    const onCreate = () =>{
        const promise = create({title:"Untitled"})
        .then((documentId)=>{
            router.push(`/documents/${documentId}`)
        })
        toast.promise(promise,{
            loading:"Creating a new note",
            success:"New note created!",
            error:"Failed to create a new note"
        })
    }
    return (
        <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Image src="/marketing-logo-1.jpg" height="250" width="250" alt="empty" />
            <h2 className="text-;g font-medium">
                Welcome to {user?.username}&apos;s Noter
            </h2>
            <Button onClick={onCreate}>
                <PlusCircle className="h-4 mr-2 w-4"/> Create a Note
            </Button>
        </div>
    )
}
export default DocumentsPage