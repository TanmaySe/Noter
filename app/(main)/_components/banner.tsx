"use client"

import { ConfirmModal } from "@/components/modals/confirm-modal"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface BannerProps{
    documentId:Id<"documents">
}
export const Banner = ({documentId}:BannerProps) => {
    const router = useRouter()
    const remove = useMutation(api.documents.remove)
    const restore = useMutation(api.documents.restore)
    const onRemove = () => {
        const promise = remove({id:documentId})
        console.log("Promise : ",promise)
        toast.promise(promise,{
            loading:"Deleting note",
            success:"Note deleted",
            error:"Failed to delete note"
        })
        router.push("/documents")
    }
    const onRestore = () => {
        const promise = restore({id:documentId})
        toast.promise(promise,{
            loading:"Restoring note",
            success:"Note restored",
            error:"Failed to restore note"
        })
    }
    return(
        <div className="bg-rose-500 w-full text-center text-sm p-2 text-white flex items-center gap-x-2 justify-center">
            <p>
                This page is in trash
            </p>
            <Button size="sm" onClick={onRestore} variant="outline" className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal">
                Restore page
            </Button>
            <ConfirmModal onConfirm={onRemove}>
            <Button size="sm" variant="outline" className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal">
                Remove page
            </Button>
            </ConfirmModal>
        </div>
    )
}