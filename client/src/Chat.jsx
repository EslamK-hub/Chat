import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

export default function Chat() {
    const [ws, setWs] = useState(null);
    useEffect(() => {
        const ws = new WebSocket(`ws://${import.meta.env.VITE_API_WEB_SOCKET}`);
        setWs(ws);
        ws.addEventListener("message", handleMessage);
    }, []);

    function handleMessage(e) {
        console.log("new message", e);
    }

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3">Contacts</div>
            <div className="flex flex-col bg-white w-2/3 p-2">
                <div className=" flex-grow">messages with selected person</div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type your message here"
                        className="bg-white flex-grow border p-2 rounded-full"
                    />
                    <button className="bg-green-500 p-2 text-white rounded-full">
                        <Icon
                            icon="iconamoon:send"
                            width="1.6rem"
                            height="1.6rem"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
