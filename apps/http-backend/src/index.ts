import express from "express";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {CreateRoomSchema, CreateUserSchema, CreateUserSignin} from "@repo/common/types"
import { prismaClient } from "@repo/db/client";
import cors from "cors"
import bcrypt from "bcryptjs";

const app=express();
app.use(express.json())
app.use(cors())

app.post("/signup",async(req,res)=>{
    const parseData=CreateUserSchema.safeParse(req.body);
    if(!parseData.success){
        console.error(parseData.error)
        res.json({
            message:"Incorrect Inputs"
        })
        return;
    }

    //TODO:compare the hashed password here
 try{
      const hashedPassword = await bcrypt.hash(parseData.data.password, 10);
      const user=await prismaClient.user.create({
     data:{
        email:parseData.data?.email,
        password:hashedPassword,
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
            email:parseData.data.email
        }
    })
    if(!user){
        res.status(403).json({
            message:"Not authorized"
        })
        return;
    }

    const isPasswordValid = await bcrypt.compare(parseData.data.password, user.password);
    if(!isPasswordValid){
        res.status(403).json({
            message:"Not authorized"
        })
        return;
    }

    const token=jwt.sign({
        userId:user?.id,
        name:user?.name
    },JWT_SECRET)

    res.json({
        token,
        name: user?.name
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
    const userId=req.userId;
    if (!userId) {
        res.status(401).json({ message: "Not authorized" });
        return;
    }
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


app.get("/canvas/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const elements = await prismaClient.canvasElement.findMany({
            where: { roomId: roomId },
            orderBy: { createdAt: "asc" },
            take: 1000
        });
        
        // Return exactly what the frontend expects
        res.json({
            elements: elements.map(el => ({
                id: el.id,
                type: el.type,
                data: el.data,
                isDeleted: el.isDeleted,
                createdAt: el.createdAt
            }))
        });
    } catch (e) {
        res.json({ elements: [] });
    }
});

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
app.listen(PORT);
