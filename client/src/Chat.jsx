/* eslint-disable */
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    useEffect(() => {
        const ws = new WebSocket(`ws://${import.meta.env.VITE_API_WEB_SOCKET}`);
        setWs(ws);
        ws.addEventListener("message", handleMessage);
    }, []);

    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    }

    function handleMessage(e) {
        const messageData = JSON.parse(e.data);
        if ("online" in messageData) {
            showOnlinePeople(messageData.online);
        }
    }

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3 pl-4 pt-4">
                <div className="text-green-600 font-bold flex gap-1 items-center text-2xl mb-4">
                    <Icon
                        icon="mingcute:box-3-line"
                        width="2.5rem"
                    />
                    Chatline
                </div>
                {Object.keys(onlinePeople).map((userId) => (
                    <div key={userId} className="border-b border-gray-100 py-2 flex items-center gap-2 cursor-pointer">
                        <Avatar username={onlinePeople[userId]} userId={userId}></Avatar>
                        <span className="text-gray-800">{onlinePeople[userId]}</span>
                    </div>
                ))}
            </div>
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
