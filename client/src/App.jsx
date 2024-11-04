import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {
    axios.defaults.baseURL = import.meta.env.VITE_API_SERVER;
    axios.defaults.withCredentials = true;
    return (
        <UserContextProvider>
            <Routes></Routes>
        </UserContextProvider>
    );
}

export default App;
