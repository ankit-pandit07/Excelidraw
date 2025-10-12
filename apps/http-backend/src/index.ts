import express from "express";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {CreateRoomSchema, CreateUserSchema, CreateUserSignin} from "@repo/common/types"
 
const app=express();

app.post("/signup",(req,res)=>{
    const data=CreateUserSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    //db call
    res.json({
        userId:"123"
    })
    
})
app.post("/signin",(req,res)=>{
    const data=CreateUserSignin.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect Inputs"
        })
        return;
    }

    const userId=1;
    const token=jwt.sign({
        userId
    },JWT_SECRET)

    res.json({
        token
    })
})
app.post("/room",middleware,(req,res)=>{
    const data=CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        res.json({
            message:"Incorrect Inputs"
        })
    }

})

app.listen(3000);