import { Icon } from "@iconify/react/dist/iconify.js";

export default function Logo() {
    return (
        <div className="text-green-600 font-bold flex gap-1 items-center text-2xl mb-4 p-4">
            <Icon icon="mingcute:box-3-line" width="2.5rem" />
            Chatline
        </div>
    );
}
