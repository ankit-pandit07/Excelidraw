"use client";

export function Authpage({isSignin}:{
    isSignin:boolean
}){
    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-2 m-2">
            <div className="p-3">
        <input type="text" placeholder="Email" />
        </div>
        <div className="p-3">
        <input type="password" placeholder="password" />
        </div>
        <div className="p-3">
        <button onClick={()=>{
        
        }}>
            {isSignin ? "Sign in":"Sign up"}
        </button>
        </div>
        </div>
    </div>
}