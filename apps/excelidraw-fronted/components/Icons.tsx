import { ReactNode } from "react"

export function IconButton({
    icon, onClick, activated, title
}:{
    icon: ReactNode,
    onClick: () => void,
    activated?: boolean,
    title?: string
}){
    return (
        <button 
            title={title}
            onClick={onClick}
            className={`m-1 flex cursor-pointer items-center justify-center rounded-xl p-2.5 transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                activated 
                    ? "bg-white text-black shadow-md" 
                    : "bg-transparent text-[#9ca3af] hover:bg-[#2f2f2f] hover:text-white"
            }`}
        >
            {icon}
        </button>
    )
}