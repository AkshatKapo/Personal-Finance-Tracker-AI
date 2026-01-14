import { useState } from "react";
import api from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function AddBillPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [frequency, setFrequency] = useState("monthly");

    const submit = async () => {
        try {
            await api.post("/bills/create", {
                name,
                amount,
                dueDate,
                frequency,
            });
            ;

            navigate("/bills");
        } catch (err) {
            console.log("Error creating bill:", err);
        }
    };

    return (
        <div className="p-6 max-w-[600px] mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add Bill</h1>

            <label>Bill Name</label>
            <input
                className="border p-2 w-full mb-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <label>Amount</label>
            <input
                type="number"
                className="border p-2 w-full mb-3"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />

            <label>Due Date</label>
            <input
                type="datetime-local"
                className="border p-2 w-full mb-3"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />

            <label>Frequency</label>
            <select
                className="border p-2 w-full mb-4"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
            >
                <option>monthly</option>
                <option>yearly</option>
            </select>

            <button
                onClick={submit}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Submit
            </button>
        </div>
    );
}
