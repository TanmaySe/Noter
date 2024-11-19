import {v} from "convex/values"
import{mutation,query} from "./_generated/server"
import {Doc,Id} from "./_generated/dataModel"

export const getSidebar = query({
    args:{
        parentDocument:v.optional(v.id("documents"))
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity){
            throw new Error("user not authenticated")
        }
        const userId = identity.subject
        const documents = await ctx.db.query("documents").withIndex("by_user_parent",(q)=>
            q.eq("userId",userId).eq("parentDocument",args.parentDocument)
        ).filter((q)=>
        q.eq(q.field("isArchived"),false)
        ).order("desc").collect()
        return documents

    }
})
export const archive = mutation({
args:{
    id:v.id("documents")
},
handler:async(ctx,args)=>{
    const identity = await ctx.auth.getUserIdentity();
    if(!identity){
        throw new Error("Not authenticated")
    }
    const userId = identity.subject;
    const existingDocument = await ctx.db.get(args.id)
    if(!existingDocument){
        throw new Error("Not found")

    }
    if(existingDocument.userId != userId){
        throw new Error("Not authorised to archive")
    }
    const recursiveArchive = async (documentId:Id<"documents">)=>{
        const children = await ctx.db.query("documents").withIndex("by_user_parent",(q)=>(
            q.eq("userId",userId).eq("parentDocument",documentId)
        )).collect()
        for(const child of children){
            await ctx.db.patch(child._id,{
                isArchived:true
            })
            await recursiveArchive(child._id)
        }
    }
    const document = await ctx.db.patch(args.id,{
        isArchived:true
    })
    recursiveArchive(args.id)
    return document
}
})
export const create = mutation({
    args:{
        title:v.string(),
        parentDocument:v.optional(v.id("documents"))
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }
        const userId = identity.subject;
        const document = await ctx.db.insert("documents",{
            title:args.title,
            parentDocument:args.parentDocument,
            userId,
            isArchived:false,
            isPublished:false
        })
        return document
    }
})

export const getTrash = query({
    handler:async(ctx)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }
        const userId = identity.subject
        const documents = await ctx.db.query("documents").withIndex("by_user",(q)=>q.eq("userId",userId)).filter((q)=>q.eq(q.field("isArchived"),true)).order("desc").collect()
        return documents
    }
    
})

export const restore = mutation({
    args:{
        id:v.id("documents")
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }
        const userId = identity.subject
        const existingDocument = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("Not found")
        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorised restore request")
        }
        const recursiveRestore = async(documentId:Id<"documents">) => {
            const children = await ctx.db.query("documents").withIndex("by_user_parent",(q)=>(
                q.eq("userId",userId).eq("parentDocument",documentId)
            )).collect()
            for (const child of children ){
                await ctx.db.patch(child._id,{
                    isArchived:false
                })
                await recursiveRestore(child._id)
            }
        }
        const options: Partial<Doc<"documents">> = {
            isArchived:false
        }
        if(existingDocument.parentDocument){
            const parent = await ctx.db.get(existingDocument.parentDocument)
            if(parent?.isArchived){
                options.parentDocument = undefined

            }
        }
        const document = await ctx.db.patch(args.id,options);
        recursiveRestore(args.id)
        return document
    }
})

// export const remove = mutation({
//     args:{id:v.id("documents")},
//     handler:async(ctx,args)=>{
//         const identity = await ctx.auth.getUserIdentity();
//         if(!identity){
//             throw new Error("Not authenticated")
//         }
//         const userId = identity.subject
//         const existingDocument = await ctx.db.get(args.id)
//         if(!existingDocument){
//             throw new Error("No note found")
//         }
//         if(existingDocument.userId !== userId){
//             throw new Error("Unauthorised delete request")
//         }
//         const document = await ctx.db.delete(args.id)
//         return document
//     }
// })
export const remove = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id);
        if (!existingDocument) {
            throw new Error("No note found");
        }
        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorised delete request");
        }

        // Recursive function to delete children documents
        const recursiveDelete = async (documentId: Id<"documents">) => {
            const children = await ctx.db.query("documents").withIndex("by_user_parent", (q) =>
                q.eq("userId", userId).eq("parentDocument", documentId)
            ).collect();

            for (const child of children) {
                // First, delete children of the current document
                await recursiveDelete(child._id);
                // Then, delete the current child
                await ctx.db.delete(child._id);
            }
        };

        // First, recursively delete all children
        await recursiveDelete(args.id);

        // Finally, delete the selected document
        await ctx.db.delete(args.id);

        return { success: true, message: "Document and its children deleted" };
    }
});


export const getSearch = query({
    handler:async(ctx)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }
        const userId = identity.subject
        const documents = await ctx.db
        .query("documents")
        .withIndex("by_user",(q)=>q.eq("userId",userId))
        .filter((q)=>q.eq(q.field("isArchived"),false),)
        .order("desc")
        .collect()
        return documents
    }
})

export const getById = query({
    args:{
        documentId:v.id("documents")
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        const document = await ctx.db.get(args.documentId)
        const userId = identity?.subject
        if(!document){
            throw new Error("Document not found")
        }
        if(!identity){
            throw new Error("Not authenticated")
        }
        if(document.userId !== userId){
            throw new Error("Not authorised")
        }

        // if(document.isPublished && !document.isArchived){
        //     return document
        // }
        // if(!identity){
        //     throw new Error("Not authorised")
        // }
        // const userId = identity.subject
        // if(document.userId !== userId){
        //     throw new Error("Not authorised")
        // }
        return document
    }
})

export const update = mutation({
    args:{
        id:v.id("documents"),
        title:v.optional(v.string()),
        content:v.optional(v.string()),
        coverImage:v.optional(v.string()),
        icon:v.optional(v.string()),
        isPublished:v.optional(v.boolean()),


    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity){
            return;
        }
        const userId = identity.subject
        const{id,...rest}=args
        const existingDocument = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("Not found ")

        }
        if(existingDocument.userId !== userId){
            throw new Error("Unauthorised")
        }
        const document = await ctx.db.patch(args.id,{
            ...rest
        })
        return document
    }

})

export const removeIcon = mutation({
    args:{
        id:v.id("documents")
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity){
            throw new Error("Not authenticated")

        }
        const userId = identity.subject
        const existingDocument = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("doc not found")
        }
        if(existingDocument.userId !== userId){
            throw new Error("Not authorised")
        }
        const document = await ctx.db.patch(args.id,{
            icon:undefined
        })
        return document
    }
})

export const removeCoverImage = mutation({
    args:{
        id:v.id("documents")
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity()
        if(!identity){
            throw new Error("Not authenticated")

        }
        const userId = identity.subject
        const existingDocument = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("doc not found")
        }
        if(existingDocument.userId !== userId){
            throw new Error("Not authorised")
        }
        const document = await ctx.db.patch(args.id,{
            coverImage:undefined
        })
        return document
    }
})
export const publish = mutation({
    args:{
        id:v.id("documents"),
        isPublished:v.boolean()
    },
    handler:async(ctx,args)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }
        const userId = identity.subject;
        const existingDocument = await ctx.db.get(args.id)
        if(!existingDocument){
            throw new Error("Not found")
    
        }
        if(existingDocument.userId != userId){
            throw new Error("Not authorised to archive")
        }
        const recursivePublish = async (documentId:Id<"documents">)=>{
            const children = await ctx.db.query("documents").withIndex("by_user_parent",(q)=>(
                q.eq("userId",userId).eq("parentDocument",documentId)
            )).collect()
            for(const child of children){
                if(!child.isArchived){
                    await ctx.db.patch(child._id,{
                        isPublished:args.isPublished
                    })
                }
                
                await recursivePublish(child._id)
            }
        }
        const document = await ctx.db.patch(args.id,{
            isPublished:args.isPublished
        })
        
        recursivePublish(args.id)
        return document
    }
    })
    export const getByIdPreview = query({
        args:{
            documentId:v.id("documents")
        },
        handler:async(ctx,args)=>{
            const document = await ctx.db.get(args.documentId)
            if(!document){
                throw new Error("Document not found")
            }
            if(document.isArchived || !document.isPublished){
                throw new Error("Document not available")
            }
            // if(document.isPublished && !document.isArchived){
            //     return document
            // }
            // if(!identity){
            //     throw new Error("Not authorised")
            // }
            // const userId = identity.subject
            // if(document.userId !== userId){
            //     throw new Error("Not authorised")
            // }
            return document
        }
    })