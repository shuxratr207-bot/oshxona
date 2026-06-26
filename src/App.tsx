import { useState, useEffect } from "react";
import { database, auth } from "../Firebase"; 
import { ref, set, onValue, update, push } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";

const MENU_ITEMS = [
  { id: 1, name: "Xonim porsiya", price: 38000 }, { id: 2, name: "Xonim dona", price: 7500 },
  { id: 3, name: "Manti go'shtli dona", price: 7500 }, { id: 4, name: "Manti kadu dona", price: 5000 },
  { id: 5, name: "Lagman", price: 35000 }, { id: 6, name: "Chakka qayish", price: 25000 },
  { id: 7, name: "Podjarka", price: 40000 }, { id: 8, name: "Pelmen", price: 35000 },
  { id: 10, name: "Belyashi", price: 5000 }, { id: 11, name: "Sasiska testo", price: 5000 },
  { id: 12, name: "Go'shtli perashki", price: 5000 }, { id: 13, name: "Choy", price: 10000 },
  { id: 14, name: "Kompot", price: 10000 }, { id: 15, name: "Non", price: 5000 },
  { id: 16, name: "Somsa", price: 5000 }, { id: 17, name: "Tarelka", price: 20000 },
  { id: 18, name: "Lo'blo qayish", price: 30000 }, { id: 19, name: "Saboy qutti", price: 2000 },
  { id: 20, name: "kola 0,5", price: 8000 }, { id: 21, name: "sprite 0,5", price: 8000 },
  { id: 22, name: "kola 1,5", price: 15000 }, { id: 23, name:"suv 0,5", price: 3000 },
  { id: 24, name:"suv gazli 0,5", price: 4000 }, { id: 25, name: "perashki", price: 3500 },
  { id: 26, name: "galupsi", price: 3500 },
];

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({ cash: 0, card: 0 });
  const [tables, setTables] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null); 
  const [modalType, setModalType] = useState<string | null>(null); 
  const [payment, setPayment] = useState({ cash: "", card: "" }); 
  const [showPaymentFields, setShowPaymentFields] = useState(false); 
  const [showReport, setShowReport] = useState(false);
  const [expenseInput, setExpenseInput] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          setCurrentUser((prev: any) => ({ ...prev, displayName: data?.name || "Ofitsiant" }));
          setLoading(false);
        }, { onlyOnce: true });
      } else { setCurrentUser(null); setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    onValue(ref(database, "dailyStats"), (s) => { if (s.exists()) setDailyStats(s.val()); });
    onValue(ref(database, "tables"), (s) => { if (s.exists()) setTables(Object.keys(s.val()).map(k => ({ ...s.val()[k], dbKey: k })).sort((a,b) => a.id - b.id)); });
    onValue(ref(database, "deliveries"), (s) => { if (s.exists()) setDeliveries(Object.keys(s.val()).map(k => ({ ...s.val()[k], dbKey: k }))); else setDeliveries([]); });
    onValue(ref(database, "expenses"), (s) => { if (s.exists()) setExpenses(Object.values(s.val())); else setExpenses([]); });
  }, [currentUser]);

  const jamiTushum = (dailyStats.cash || 0) + (dailyStats.card || 0);
  const jamiRasxod = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const sofFoyda = jamiTushum - jamiRasxod;

  const calculateTotal = (item: any) => item?.orders ? Object.entries(item.orders).reduce((sum: number, [id, count]: any) => sum + (MENU_ITEMS.find(m => m.id === Number(id))?.price! * count || 0), 0) : 0;
  
  const handleTableClick = (item: any, isNewDelivery = false) => { setSelectedItem(isNewDelivery ? { name: "Dastafka", orders: {}, type: "delivery" } : { ...item, orders: item?.orders || {} }); setShowPaymentFields(false); setModalType("menu"); };

  const saveOrder = () => {
    if (selectedItem.type === "delivery") {
      const newDelRef = selectedItem.dbKey ? ref(database, `deliveries/${selectedItem.dbKey}`) : push(ref(database, "deliveries"));
      set(newDelRef, { ...selectedItem, status: "ordered", waiterName: currentUser.displayName });
    } else {
      set(ref(database, `tables/${selectedItem.dbKey}`), { ...selectedItem, status: "ordered", waiterName: currentUser.displayName });
    }
    closeModal();
  };

  const handlePay = () => {
    update(ref(database, "dailyStats"), { cash: dailyStats.cash + Number(payment.cash || 0), card: dailyStats.card + Number(payment.card || 0) });
    if (selectedItem.type === "delivery") set(ref(database, `deliveries/${selectedItem.dbKey}`), null);
    else set(ref(database, `tables/${selectedItem.dbKey}`), { ...selectedItem, status: "empty", orders: {}, waiterName: "" });
    closeModal();
  };

  const closeModal = () => { setSelectedItem(null); setModalType(null); setShowPaymentFields(false); setPayment({ cash: "", card: "" }); };

  if (loading) return <div>Yuklanmoqda...</div>;
  if (!currentUser) return <Auth />;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-3xl shadow-lg mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black text-gray-800">Onajonim Oshxonasi</h1>
           <div className="flex gap-6 text-xl font-bold text-gray-700 mt-3">
             <span>Naqd: <span className="text-green-600">{dailyStats.cash.toLocaleString()}</span></span>
             <span>Karta: <span className="text-blue-600">{dailyStats.card.toLocaleString()}</span></span>
             <span className="text-red-600 border-l pl-6">Jami: {jamiTushum.toLocaleString()}</span>
           </div>
           <button onClick={() => setShowReport(!showReport)} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl font-bold">Hisobot va Rasxod</button>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg">Chiqish</button>
      </div>

      {showReport && (
        <div className="bg-white p-8 rounded-3xl shadow-lg mb-8 border-4 border-purple-200">
            <h2 className="text-2xl font-bold mb-4">Hisobot Paneli</h2>
            <div className="text-xl font-bold mb-4 space-y-2">
                <p>Tushum: {jamiTushum.toLocaleString()}</p>
                <p className="text-orange-600">Rasxod: {jamiRasxod.toLocaleString()}</p>
                <p className="text-2xl text-green-700">Sof Foyda: {sofFoyda.toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="number" placeholder="Rasxod summasi" className="p-4 border-2 rounded-xl w-full" value={expenseInput} onChange={e => setExpenseInput(e.target.value)} />
              <button onClick={() => { if(expenseInput) { push(ref(database, "expenses"), { amount: Number(expenseInput), date: new Date().toLocaleTimeString() }); setExpenseInput(""); } }} className="bg-orange-500 text-white px-6 rounded-xl">Qo'shish</button>
            </div>
            <button onClick={() => { if(window.confirm("Kassani nol qilmoqchimisiz?")) { set(ref(database, "dailyStats"), { cash: 0, card: 0 }); set(ref(database, "expenses"), null); } }} className="bg-red-600 text-white w-full py-4 rounded-xl font-bold">KASSANI VA RASXODNI NOL QILISH</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {tables.map((table) => (
          <button key={table.dbKey} onClick={() => handleTableClick(table)} className={`h-[150px] rounded-3xl border-4 flex flex-col justify-center items-center shadow-md transition-all ${table.status === "ordered" ? "bg-white border-blue-500" : "bg-amber-50 border-amber-200"}`}>
            <span className="text-xl font-black">{table.name}</span>
            {table.status === "ordered" && <p className="text-lg font-bold text-blue-900">{calculateTotal(table).toLocaleString()} so'm</p>}
          </button>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Dastafkalar</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {deliveries.map((del) => (
            <button key={del.dbKey} onClick={() => handleTableClick(del)} className="h-[150px] rounded-3xl border-4 bg-white border-green-500 flex flex-col justify-center items-center shadow-md">
              <span className="text-lg font-bold">{del.name}</span>
              <p className="text-sm font-bold text-green-600">{del.phone}</p>
              <p className="text-lg font-black mt-2">{calculateTotal(del).toLocaleString()} so'm</p>
            </button>
          ))}
          <button onClick={() => handleTableClick(null, true)} className="border-4 border-dashed border-gray-400 rounded-3xl h-[150px] text-4xl">+</button>
        </div>
      </div>

      {modalType === "menu" && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal tarkibi */}
            {!showPaymentFields && selectedItem.type === "delivery" && (
              <div className="mb-6 space-y-4">
                <input placeholder="Tel nomer" className="w-full p-4 text-xl border-2 rounded-2xl" value={selectedItem.phone || ""} onChange={e => setSelectedItem({...selectedItem, phone: e.target.value})} />
                <input placeholder="Adres" className="w-full p-4 text-xl border-2 rounded-2xl" value={selectedItem.address || ""} onChange={e => setSelectedItem({...selectedItem, address: e.target.value})} />
              </div>
            )}
            {!showPaymentFields && MENU_ITEMS.map((item) => (
              <div key={item.id} className="flex justify-between py-4 border-b text-xl font-bold items-center">
                <span>{item.name}</span>
                <div className="flex gap-4">
                  <button onClick={() => setSelectedItem({...selectedItem, orders: {...selectedItem.orders, [item.id]: Math.max(0, (selectedItem.orders[item.id] || 0) - 1)}})} className="bg-gray-200 px-6 py-2 rounded-xl">-</button>
                  <span className="w-8 text-center">{selectedItem.orders[item.id] || 0}</span>
                  <button onClick={() => setSelectedItem({...selectedItem, orders: {...selectedItem.orders, [item.id]: (selectedItem.orders[item.id] || 0) + 1}})} className="bg-amber-400 px-6 py-2 rounded-xl">+</button>
                </div>
              </div>
            ))}
            {showPaymentFields && (
               <div className="p-8 bg-blue-50 rounded-3xl">
                  <p className="text-center text-4xl font-black">{calculateTotal(selectedItem).toLocaleString()} so'm</p>
                  <input type="number" placeholder="Naqd" className="w-full p-4 mt-4 text-xl border-2 rounded-2xl" onChange={e => setPayment({...payment, cash: e.target.value})} />
                  <input type="number" placeholder="Karta" className="w-full p-4 mt-2 text-xl border-2 rounded-2xl" onChange={e => setPayment({...payment, card: e.target.value})} />
               </div>
            )}
            <div className="mt-8 flex gap-4">
              {!showPaymentFields && <button onClick={saveOrder} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl">Saqlash</button>}
              {!showPaymentFields && <button onClick={() => setShowPaymentFields(true)} className="bg-black text-white px-10 py-4 rounded-2xl">To'lash</button>}
              {showPaymentFields && <button onClick={handlePay} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl">Kassani Yopish</button>}
              <button onClick={closeModal} className="bg-gray-200 px-10 py-4 rounded-2xl">Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;