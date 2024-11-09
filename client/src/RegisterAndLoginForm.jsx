import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

    async function handleSubmit(e) {
        e.preventDefault();
        const url = isLoginOrRegister === "register" ? "register" : "login";
        const { data } = await axios.post(url, {
            username,
            password,
        });
        setLoggedInUsername(username);
        setId(data.id);
    }
    return (
        <div className="bg-green-50 h-screen flex items-center">
            <form className="w-64 mx-auto" onSubmit={handleSubmit}>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    className="block w-full rounded-sm p-2 mb-2"
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="password"
                    className="block w-full rounded-sm p-2 mb-2"
                />
                <button className="bg-green-500 text-white block w-full rounded-sm p-2">
                    {isLoginOrRegister === "register" ? "Register" : "Login"}
                </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === "register" && (
                        <div>
                            Already a member?{" "}
                            <button
                                className="ml-1"
                                onClick={() => setIsLoginOrRegister("login")}
                            >
                                Login here
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === "login" && (
                        <div>
                            Don&apos;t have an account?{" "}
                            <button
                                className="ml-1"
                                onClick={() => setIsLoginOrRegister("register")}
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
