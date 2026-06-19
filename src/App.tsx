import { useState, useEffect } from "react";
import { database, auth } from "../Firebase"; 
import { ref, set, onValue, update, push } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";

const MENU_ITEMS = [
  { id: 1, name: "Xonim porsiya", price: 38000 },
  { id: 2, name: "Xonim dona", price: 7500 },
  { id: 3, name: "Manti go'shtli dona", price: 7500 },
  { id: 4, name: "Manti kadu dona", price: 5000 },
  { id: 5, name: "Lagman", price: 35000 },
  { id: 6, name: "Chakka qayish", price: 25000 },
  { id: 7, name: "Podjarka", price: 40000 },
  { id: 8, name: "Pelmen", price: 35000 },
  { id: 10, name: "Belyashi", price: 5000 },
  { id: 11, name: "Sasiska testo", price: 5000 },
  { id: 12, name: "Go'shtli perashki", price: 5000 },
  { id: 13, name: "Choy", price: 10000 },
  { id: 14, name: "Kompot", price: 10000 },
  { id: 15, name: "Non", price: 5000 },
  { id: 16, name: "Somsa", price: 8000 },
  { id: 17, name: "Tarelka", price: 20000 },
  { id: 18, name: "Lo'blo qayish", price: 30000 },
  { id: 19, name: "Saboy qutti", price: 2000 },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({ cash: 0, card: 0 });
  const [tables, setTables] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [modalType, setModalType] = useState(null); 
  const [payment, setPayment] = useState({ cash: "", card: "" }); 
  const [showPaymentFields, setShowPaymentFields] = useState(false); 

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.email?.toLowerCase() === "onajonimoshxonasi@gmail.com") {
          setUserRole("admin");
          setLoading(false);
        } else {
          const userRef = ref(database, `users/${user.uid}`);
          onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUserRole(data?.role || "waiter");
            setCurrentUser(prev => ({ ...prev, displayName: data?.name || "Ofitsiant" }));
            setLoading(false);
          }, { onlyOnce: true });
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const statsRef = ref(database, "dailyStats");
    onValue(statsRef, (snapshot) => { if (snapshot.exists()) setDailyStats(snapshot.val()); });

    const tablesRef = ref(database, "tables");
    onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTables(Object.keys(data).map(key => ({ ...data[key], dbKey: key })).sort((a,b) => a.id - b.id));
      }
    });

    const delRef = ref(database, "deliveries");
    onValue(delRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDeliveries(Object.keys(data).map(key => ({ ...data[key], dbKey: key })));
      } else setDeliveries([]);
    });
  }, [currentUser]);

  const handleTableClick = (item, isNewDelivery = false) => {
    setSelectedItem(isNewDelivery ? { name: "Dastafka", orders: {}, type: "delivery" } : { ...item, orders: item.orders || {} });
    setShowPaymentFields(false);
    setModalType("menu");
  };

  const saveOrder = () => {
    if (selectedItem.type === "delivery") {
      const newDelRef = selectedItem.dbKey ? ref(database, `deliveries/${selectedItem.dbKey}`) : push(ref(database, "deliveries"));
      set(newDelRef, { ...selectedItem, status: "ordered", waiterName: currentUser.displayName }).then(closeModal);
    } else {
      set(ref(database, `tables/${selectedItem.dbKey}`), { ...selectedItem, status: "ordered", waiterName: currentUser.displayName }).then(closeModal);
    }
  };

  const handlePay = () => {
    const cash = Number(payment.cash || 0);
    const card = Number(payment.card || 0);
    const totalPayment = cash + card;
    const orderTotal = calculateTotal(selectedItem);

    if (totalPayment !== orderTotal) {
      alert(`Xatolik! Buyurtma summasi ${orderTotal.toLocaleString()} so'm, lekin siz ${totalPayment.toLocaleString()} so'm kiritdingiz.`);
      return;
    }

    update(ref(database, "dailyStats"), { cash: dailyStats.cash + cash, card: dailyStats.card + card });
    
    if (selectedItem.type === "delivery") {
      set(ref(database, `deliveries/${selectedItem.dbKey}`), null).then(closeModal);
    } else {
      set(ref(database, `tables/${selectedItem.dbKey}`), { ...selectedItem, status: "empty", orders: {}, waiterName: "" }).then(closeModal);
    }
  };

  const closeModal = () => { setSelectedItem(null); setModalType(null); setShowPaymentFields(false); setPayment({ cash: "", card: "" }); };
  const calculateTotal = (item) => {
    if (!item?.orders) return 0;
    return Object.entries(item.orders).reduce((sum, [id, count]) => sum + (MENU_ITEMS.find(m => m.id === Number(id))?.price * count || 0), 0);
  };

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
             <span className="text-red-600 border-l pl-6">Jami: {(dailyStats.cash + dailyStats.card).toLocaleString()}</span>
           </div>
        </div>
        <button onClick={() => signOut(auth)} className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg">Chiqish</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {tables.map((table) => (
          <button 
            key={table.dbKey} 
            onClick={() => handleTableClick(table)} 
            className={`h-[150px] rounded-3xl border-4 flex flex-col justify-center items-center shadow-md transition-all ${table.status === "ordered" ? "bg-white border-blue-500" : "bg-amber-50 border-amber-200"}`}
          >
            <span className="text-xl font-black">{table.name}</span>
            
            {table.status === "ordered" && (
              <div className="flex flex-col items-center mt-2">
                <p className="text-lg font-bold text-blue-900">
                  {calculateTotal(table).toLocaleString()} so'm
                </p>
                
                {userRole === "admin" && table.waiterName && (
                  <span className="text-[10px] font-bold text-gray-500 uppercase mt-1 bg-gray-100 px-2 py-0.5 rounded-full">
                    👤 {table.waiterName}
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {userRole === "admin" && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Dastafkalar</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {deliveries.map((del) => (
              <button key={del.dbKey} onClick={() => handleTableClick(del)} className="h-[150px] rounded-3xl border-4 bg-white border-green-500 flex flex-col justify-center items-center shadow-md">
                <span className="text-lg font-bold">{del.name}</span>
                <p className="text-sm font-bold text-green-600">{del.phone}</p>
                <p className="text-xs">{del.address}</p>
                <p className="text-lg font-black mt-2 text-gray-800">{calculateTotal(del).toLocaleString()} so'm</p>
              </button>
            ))}
            <button onClick={() => handleTableClick(null, true)} className="border-4 border-dashed border-gray-400 rounded-3xl h-[150px] text-4xl">+</button>
          </div>
        </div>
      )}

      {modalType === "menu" && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {!showPaymentFields && selectedItem.type === "delivery" && (
              <div className="mb-6 space-y-4">
                <input placeholder="Tel nomer" className="w-full p-4 text-xl border-2 rounded-2xl" value={selectedItem.phone || ""} onChange={e => setSelectedItem({...selectedItem, phone: e.target.value})} />
                <input placeholder="Adres" className="w-full p-4 text-xl border-2 rounded-2xl" value={selectedItem.address || ""} onChange={e => setSelectedItem({...selectedItem, address: e.target.value})} />
              </div>
            )}
            
            {!showPaymentFields && MENU_ITEMS.map((item) => {
              const count = selectedItem.orders[item.id] || 0;
              return (
                <div key={item.id} className="flex justify-between py-4 border-b text-xl font-bold">
                  <span>{item.name}</span>
                  <div className="flex gap-4 items-center">
                    <button onClick={() => setSelectedItem({...selectedItem, orders: {...selectedItem.orders, [item.id]: Math.max(0, count - 1)}})} className="bg-gray-200 px-6 py-2 rounded-xl">-</button>
                    <span className="w-8 text-center">{count}</span>
                    <button onClick={() => setSelectedItem({...selectedItem, orders: {...selectedItem.orders, [item.id]: count + 1}})} className="bg-amber-400 px-6 py-2 rounded-xl">+</button>
                  </div>
                </div>
              );
            })}

            {showPaymentFields && (
              <div className="mt-4 p-8 bg-blue-50 rounded-3xl border-4 border-blue-300 shadow-2xl">
                <div className="text-center mb-8">
                  <p className="text-gray-600 text-2xl font-bold">Jami to'lov:</p>
                  <p className="text-7xl font-black text-blue-900 mt-2">{calculateTotal(selectedItem).toLocaleString()} so'm</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-xl font-bold text-gray-700 block mb-2">Naqd pul</label>
                    <input type="number" value={payment.cash} className="w-full p-6 text-4xl font-bold border-4 rounded-2xl" onChange={e => setPayment({...payment, cash: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xl font-bold text-gray-700 block mb-2">Karta</label>
                    <input type="number" value={payment.card} className="w-full p-6 text-4xl font-bold border-4 rounded-2xl" onChange={e => setPayment({...payment, card: e.target.value})} />
                  </div>
                  
                  <div className="mt-8 p-8 bg-blue-900 rounded-3xl">
                    <div className="flex justify-between text-3xl font-bold text-white mb-6">
                        <span>Naqd: {Number(payment.cash || 0).toLocaleString()}</span>
                        <span>Karta: {Number(payment.card || 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t-4 border-blue-700 pt-6 flex justify-between items-center text-6xl font-black text-white">
                        <span>Jami:</span> 
                        <span>{(Number(payment.cash || 0) + Number(payment.card || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex gap-4">
              {!showPaymentFields && <button onClick={saveOrder} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xl font-bold">Saqlash</button>}
              {userRole === "admin" && !showPaymentFields && <button onClick={() => setShowPaymentFields(true)} className="bg-gray-900 text-white px-10 py-4 rounded-2xl text-xl font-bold">To'lash</button>}
              {showPaymentFields && <button onClick={handlePay} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-xl font-bold">Kassani Yopish</button>}
              <button onClick={closeModal} className="bg-gray-200 px-10 py-4 rounded-2xl text-xl font-bold">Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;