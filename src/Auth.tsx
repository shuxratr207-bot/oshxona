import { useState } from "react";
import { auth, database } from "../Firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isSignUp) {
        // Ro'yxatdan o'tish
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await set(ref(database, `users/${userCredential.user.uid}`), {
          uid: userCredential.user.uid,
          name: name.trim(),
          role: "waiter" // Ofitsiantlar uchun default
        });
      } else {
        // Tizimga kirish
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      // Xatolikni foydalanuvchiga osonroq tushuntirish
      if (err.code === "auth/invalid-credential") {
        setError("Email yoki parol noto'g'ri.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Bu email allaqachon ro'yxatdan o'tgan.");
      } else if (err.code === "auth/weak-password") {
        setError("Parol juda oddiy (kamida 6 ta belgi bo'lishi kerak).");
      } else {
        setError("Xatolik: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
        <h2 className="text-2xl font-black text-center mb-6">Onajonim Oshxonasi</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 font-bold text-sm">⚠ {error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input className="w-full border-2 p-4 rounded-xl" placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input type="email" className="w-full border-2 p-4 rounded-xl" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" className="w-full border-2 p-4 rounded-xl" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
          
          <button disabled={loading} className="w-full py-4 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all">
            {loading ? "Kutilmoqda..." : isSignUp ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
          </button>
        </form>

        <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-gray-500 underline mt-6 block w-full text-center">
          {isSignUp ? "Akkauntingiz bormi? Kirish" : "Ofitsiant sifatida ro'yxatdan o'tish"}
        </button>
      </div>
    </div>
  );
}
export default Auth;