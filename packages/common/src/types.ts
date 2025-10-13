import {email, z} from "zod";

export const CreateUserSchema=z.object({
    email:z.string(),
    password:z.string(),
    name:z.string()
})

export const CreateUserSignin=z.object({
    email:z.string(),
    password:z.string(),
})

export const CreateRoomSchema=z.object({
    name:z.string().min(3).max(20),
})
