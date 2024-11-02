import { useContext } from "react";
import RegisterAndLoginForm from "./RegisterAndLoginForm"
import { UserContext } from "./UserContext";

export default function Routes() {
    const { username } = useContext(UserContext);

    if (username) {
        return <h1>Welcome {username}</h1>;
    }
    return (
        <RegisterAndLoginForm></RegisterAndLoginForm>
    )
}