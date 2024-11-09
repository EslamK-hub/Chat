const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Message = require("./models/Message");
const ws = require("ws");
const fs = require("fs");

dotenv.config();
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
const jwtSecret = process.env.JWT_SECRET;

const app = express();

app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        credentials: true,
        origin: process.env.CLIENT_URL,
    })
);

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) return res.status(403).json("Invalid Token");
                resolve(userData);
            });
        } else {
            reject("No Token");
        }
    });
}

// -------------------------------------- User Messages -------------------------------------- //
app.get("/messages/:userId", async (req, res) => {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
});

// -------------------------------------- Online People -------------------------------------- //
app.get("/people", async (req, res) => {
    const users = await User.find({}, { _id: 1, username: 1 });
    res.json(users);
});

// -------------------------------------- User Profile -------------------------------------- //
app.get("/profile", (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) return res.status(403).json("Invalid Token");
            res.json({
                userId: userData.userId,
                username: userData.username,
            });
        });
    } else {
        res.status(401).json("No Token");
    }
});

// -------------------------------------- User Login -------------------------------------- //
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    try {
        const foundUser = await User.findOne({ username });
        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const passOk = await bcrypt.compare(password, foundUser.password);
        if (passOk) {
            jwt.sign(
                { userId: foundUser._id, username },
                jwtSecret,
                {},
                (err, token) => {
                    if (err)
                        return res
                            .status(500)
                            .json({ error: "Token generation failed" });
                    res.cookie("token", token, {
                        httpOnly: true,
                        sameSite: "none",
                        secure: true,
                    }).json({ id: foundUser._id });
                }
            );
        } else {
            res.status(401).json({ error: "Invalid password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// -------------------------------------- User Register -------------------------------------- //
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdUser = await User.create({
            username,
            password: hashedPassword,
        });

        jwt.sign(
            { userId: createdUser._id, username },
            jwtSecret,
            {},
            (err, token) => {
                if (err)
                    return res
                        .status(500)
                        .json({ error: "Token generation failed" });
                res.cookie("token", token, {
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                })
                    .status(201)
                    .json({ id: createdUser._id });
            }
        );
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// -------------------------------------- User Logout -------------------------------------- //
app.post("/logout", (req, res) => {
    res.cookie("token", "", { sameSite: "none", secure: true }).json("ok");
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log("Server is running on port", port);
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach((client) => {
            client.send(
                JSON.stringify({
                    online: [...wss.clients].map((c) => ({
                        userId: c.userId,
                        username: c.username,
                    })),
                })
            );
        });
    }

    connection.isAlive = true;
    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000);
    }, 5000);
    connection.on("pong", () => {
        clearTimeout(connection.deathTimer);
    });

    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies
            .split(";")
            .find((str) => str.startsWith("token="));
        if (tokenCookieString) {
            const token = tokenCookieString.split("=")[1];
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) => {
                    if (err) return res.status(403).json("Invalid Token");
                    const { userId, username } = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on("message", async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;
        if (file) {
            console.log("size", file.data.length);
            const parts = file.name.split(".");
            const ext = parts[parts.length - 1];
            filename = Date.now() + "." + ext;
            const path = __dirname + "/uploads/" + filename;
            const bufferData = new Buffer(file.data.split(",")[1], "base64");
            fs.writeFile(path, bufferData, () => {
                console.log("file saved:" + path);
            });
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });
            [...wss.clients]
                .filter((c) => c.userId === recipient)
                .forEach((c) =>
                    c.send(
                        JSON.stringify({
                            text,
                            sender: connection.userId,
                            recipient,
                            file: file ? filename : null,
                            _id: messageDoc._id,
                        })
                    )
                );
        }
    });

    notifyAboutOnlinePeople();
});
