/* eslint-disable */
import { Icon } from "@iconify/react";
import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext.jsx";
import { uniqBy } from "lodash";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState("");
    const [messages, setMessages] = useState([]);
    const { username, id } = useContext(UserContext);
    const divUnderMessages = useRef();

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
        } else if ("text" in messageData) {
            setMessages((prev) => [...prev, { ...messageData }]);
        }
    }

    function sendMessage(e) {
        e.preventDefault();
        ws.send(
            JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
            })
        );
        setNewMessageText("");
        setMessages((prev) => [
            ...prev,
            {
                text: newMessageText,
                sender: id,
                recipient: selectedUserId,
                id: Date.now(),
            },
        ]);
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    });

    const onlinePeopleExclOurUser = { ...onlinePeople };
    delete onlinePeopleExclOurUser[id];

    const messagesWithoutDupes = uniqBy(messages, "id");

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3">
                <Logo></Logo>
                {Object.keys(onlinePeopleExclOurUser).map((userId) => (
                    <div
                        onClick={() => setSelectedUserId(userId)}
                        key={userId}
                        className={
                            "border-b border-gray-100 flex items-center gap-2 cursor-pointer " +
                            (userId === selectedUserId ? "bg-green-100" : "")
                        }
                    >
                        {userId === selectedUserId && (
                            <div className="w-1 bg-green-500 h-12 rounded-r-md"></div>
                        )}
                        <div className="flex items-center gap-2 py-2 pl-4">
                            <Avatar
                                username={onlinePeople[userId]}
                                userId={userId}
                            ></Avatar>
                            <span className="text-gray-800">
                                {onlinePeople[userId]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col bg-white w-2/3 p-2">
                <div className=" flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">
                                &larr; Selected a person from the sidebar
                            </div>
                        </div>
                    )}

                    {!!selectedUserId && (
                        <div className="mb-4 h-full">
                            <div className="relative h-full">
                                <div className="overflow-y-auto absolute inset-0">
                                    {messagesWithoutDupes.map((message) => (
                                        <div
                                            key={message.id}
                                            className={
                                                message.sender === id
                                                    ? "text-right"
                                                    : "text-left"
                                            }
                                        >
                                            <div
                                                className={
                                                    "text-left inline-block p-2 my-2 rounded-sm text-sm " +
                                                    (message.sender === id
                                                        ? "bg-green-500 text-white"
                                                        : "bg-white text-gray-500")
                                                }
                                            >
                                                {message.sender === id
                                                    ? "ME:"
                                                    : ""}
                                                {message.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={divUnderMessages}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            placeholder="Type your message here"
                            className="bg-white flex-grow border p-2 rounded-full focus:border-green-600 focus:border-2 outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-green-500 p-2 text-white rounded-full"
                        >
                            <Icon
                                icon="iconamoon:send"
                                width="1.6rem"
                                height="1.6rem"
                            />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
