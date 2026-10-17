import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Admin(){
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();

        if(!name.trim() || !password.trim()){
            setError("Please fill in both admin and password.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const res = await fetch("http://localhost:4000/api/auth/login", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: name.trim(), password: password.trim()})
            });
            const data = await res.json();
            if(!res.ok) {
                setError(data.error || "Invalid admin credentials");
                return;
            }
            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("admin", JSON.stringify(data.staff));
            navigate("/admin/dashboard");
            
        } catch {
            setError("Cannot connect to server. Ensure port 4000 is running.");
        } finally {
            setLoading(false);
        }
    };

    return(
        <main className="min-h-screen bg-[#0d0c0b] px-4 text-[#f6ecdc] select-none">
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2622] bg-[#141210]">
                        <ShieldCheck className="h-7 w-7 text-[#f5a623]" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Dine<span className="text-[#f5a623]">Flow</span></h1>
                    <p className="mt-1 text-xs text-zinc-500">Admin Panel</p>
                </div>
                <div className="rounded-2xl border border-[#2a2622] bg-[#141210] p-6 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white">Admin Login</h2>
                        <p className="mt-1 text-xs text-zinc-500">Sign in to manage your restaurant</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Admin Name</label>
                            <div className="relative">
                                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError("");}} placeholder="Enter admin name" className="w-full rounded-xl border border-[#2a2622] bg-[#0d0c0b] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#f5a623]"/>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">Password</label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError("");}} placeholder="Enter password" className="w-full rounded-xl border border-[#2a2622] bg-[#0d0c0b] py-3 pl-10 pr-10 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-[#f5a623]" />
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-600 hover:text-zinc-300">{showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}</button>
                            </div>
                        </div>
                        {error && (
                            <p className="text-[11px] font-medium text-red-400">{error}</p>
                        )}
                        <button type="submit" disabled={loading} className="w-full cursor-pointer rounded-xl bg-[#f5a623] px-4 py-3 text-sm font-bold text-[#17120c] transition hover:bg-[#e0961b] active:scale-[0.98]">{loading ? "Logging in..." : "Login"}</button>
                    </form>
                </div>
            </div>
        </div>
        </main>
    );
}