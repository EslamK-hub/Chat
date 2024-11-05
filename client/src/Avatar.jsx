/* eslint-disable */
export default function Avatar({ username, userId }) {
    const colors = ['bg-teal-200', 'bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-blue-200', 'bg-yellow-200'];
    const userIdBase = parseInt(userId, 16);
    const colorIndex = userIdBase % colors.length;
    const color = colors[colorIndex]
    return (
        <div className={"w-8 h-8 rounded-full flex items-center "+color}>
            <span className="text-center w-full opacity-70">{username[0]}</span>
        </div>
    );
}
