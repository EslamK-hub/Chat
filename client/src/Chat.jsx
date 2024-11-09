/* eslint-disable */
import { Icon } from "@iconify/react";
import { useContext, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import Contact from "./Contact.jsx";
import { UserContext } from "./UserContext.jsx";
import { uniqBy } from "lodash";
import axios from "axios";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState("");
    const [messages, setMessages] = useState([]);
    const { username, id, setId, setUsername } = useContext(UserContext);
    const divUnderMessages = useRef();

    useEffect(() => {
        connectToWs();
    }, [selectedUserId]);
    function connectToWs() {
        const ws = new WebSocket(`ws://${import.meta.env.VITE_API_WEB_SOCKET}`);
        setWs(ws);
        ws.addEventListener("message", handleMessage);
        ws.addEventListener("close", () => {
            setTimeout(() => {
                console.log("Disconnected. Trying to reconnect.");
                connectToWs();
            }, 1000);
        });
    }

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
            if (messageData.sender === selectedUserId) {
                setMessages((prev) => [...prev, { ...messageData }]);
            }
        }
    }

    function logout() {
        axios.post("/logout").then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        });
    }

    function sendMessage(ev, file = null) {
        if (ev) ev.preventDefault();
        ws.send(
            JSON.stringify({
                recipient: selectedUserId,
                text: newMessageText,
                file,
            })
        );
        if (file) {
            axios.get("/messages/" + selectedUserId).then((res) => {
                setMessages(res.data);
            });
        } else {
            setNewMessageText("");
            setMessages((prev) => [
                ...prev,
                {
                    text: newMessageText,
                    sender: id,
                    recipient: selectedUserId,
                    _id: Date.now(),
                },
            ]);
        }
    }
    function sendFile(ev) {
        const reader = new FileReader();
        reader.readAsDataURL(ev.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,
            });
        };
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages]);

    useEffect(() => {
        axios.get("/people").then((res) => {
            const offlinePeopleArr = res.data
                .filter((p) => p._id !== id)
                .filter((p) => !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople = {};
            offlinePeopleArr.forEach((p) => {
                offlinePeople[p._id] = p;
            });
            setOfflinePeople(offlinePeople);
        });
    }, [onlinePeople]);

    useEffect(() => {
        if (selectedUserId) {
            axios.get("/messages/" + selectedUserId).then((res) => {
                setMessages(res.data);
            });
        }
    }, [selectedUserId]);

    const onlinePeopleExclOurUser = { ...onlinePeople };
    delete onlinePeopleExclOurUser[id];

    const messagesWithoutDupes = uniqBy(messages, "_id");

    return (
        <div className="flex h-screen">
            <div className="bg-gray-100 w-1/3 flex flex-col">
                <div className="flex-grow">
                    <Logo></Logo>
                    {Object.keys(onlinePeopleExclOurUser).map((userId) => (
                        <Contact
                            key={userId}
                            id={userId}
                            online={true}
                            username={onlinePeopleExclOurUser[userId]}
                            onClick={() => {
                                setSelectedUserId(userId);
                            }}
                            selected={userId === selectedUserId}
                        />
                    ))}
                    {Object.keys(offlinePeople).map((userId) => (
                        <Contact
                            key={userId}
                            id={userId}
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}
                </div>
                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-gray-600 flex items-center">
                        <Icon
                            icon="solar:user-linear"
                            width="1rem"
                            height="1rem"
                        />
                        {username}
                    </span>
                    <button
                        onClick={logout}
                        className="text-sm bg-green-100 py-1 px-2 text-gray-500 border rounded-sm"
                    >
                        logout
                    </button>
                </div>
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
                                            key={message._id}
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
                                                        : "bg-gray-300 text-gray-700")
                                                }
                                            >
                                                {message.text}
                                                {message.file && (
                                                    <div className="">
                                                        <a
                                                            target="_blank"
                                                            className="flex items-center gap-1 border-b"
                                                            href={
                                                                axios.defaults
                                                                    .baseURL +
                                                                "/uploads/" +
                                                                message.file
                                                            }
                                                        >
                                                            {message.file}
                                                        </a>
                                                    </div>
                                                )}
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

                        <label className="bg-green-200 p-2 text-gray-600 cursor-pointer rounded-full border border-blue-200">
                            <input
                                type="file"
                                className="hidden"
                                onChange={sendFile}
                            />
                            <Icon
                                icon="solar:link-bold"
                                width="1.6rem"
                                height="1.6rem"
                            />
                        </label>
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
