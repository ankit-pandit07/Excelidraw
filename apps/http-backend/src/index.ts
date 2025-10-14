import express from "express";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {CreateRoomSchema, CreateUserSchema, CreateUserSignin} from "@repo/common/types"
import { prismaClient } from "@repo/db/client";


const app=express();
app.use(express.json())

app.post("/signup",async(req,res)=>{
    const parseData=CreateUserSchema.safeParse(req.body);
    if(!parseData.success){
        console.log(parseData.error)
        res.json({
            message:"Incorrect Inputs"
        })
        return;
    }

    //TODO:compare the hashed password here
 try{
      const user=await prismaClient.user.create({
     data:{
        email:parseData.data?.email,
        password:parseData.data.password,
        name:parseData.data.name
     }
    })
    res.json({
        userId:user.id
    })
 }catch(e){
    res.status(411).json({
        message:"User already exits with this username"
    })
 }
    
})
app.post("/signin",async(req,res)=>{
    const parseData=CreateUserSignin.safeParse(req.body);
    if(!parseData.success){
        res.json({
            message:"Incorrect Inputs"
        })
        return;
    }

    //TODO:compare the hashed pssword here
    const user=await prismaClient.user.findFirst({
        where:{
            email:parseData.data.email,
            password:parseData.data.password
        }
    })
    if(!user){
        res.status(403).json({
            message:"Not authorized"
        })
        return;
    }

    const token=jwt.sign({
        userId:user?.id
    },JWT_SECRET)

    res.json({
        token
    })
})
app.post("/room",middleware,async(req,res)=>{
    const parseData=CreateRoomSchema.safeParse(req.body);
    if(!parseData.success){
        res.json({
            message:"Incorrect Inputs"
        })
        return;
    }
    //@ts-ignore : TODO Fix this
    const userId=req.userId;
   try{
     const room=await prismaClient.room.create({
        data:{
            slug: parseData.data.name,
            adminId:userId
        }
    })
    res.json({
        roomId:room.id
    })
}catch(e){
    res.status(411).json({
        message:"Room already exists with this name"
    })
}
})

app.get("/chats/:roomId",async (req,res)=>{
    try{
    const roomId=Number(req.params.roomId);
    const messages=await prismaClient.chat.findMany({
        where:{
            roomId:roomId
        },
        orderBy:{
            id:"desc"
        },
        take:50
    })
    res.json({
        messages
    })
}catch(e){
    res.json({
        message:[]
    })
}
})
app.get("/room/:slug",async (req,res)=>{
    const slug=req.params.slug;
    const room=await prismaClient.room.findFirst({
        where:{
            slug
        }
    })
    res.json({
        room
    })
})

const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
