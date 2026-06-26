function Bunner({ stats, onClose }) {
  const cash = Number(stats?.cash || 0);
  const card = Number(stats?.card || 0);
  const expenses = Number(stats?.expenses || 0);
  
  const totalIncome = cash + card; // Naqd + Karta
  const netProfit = totalIncome - expenses; // Jami - Rasxod

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
        <h2 className="text-3xl font-black mb-6 text-center text-gray-800">Kunlik Hisobot</h2>
        <div className="space-y-4">
          <div className="flex justify-between text-xl font-bold bg-green-50 p-4 rounded-xl border border-green-200">
            <span className="text-gray-600">Naqd:</span> 
            <span className="text-green-700">{cash.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold bg-blue-50 p-4 rounded-xl border border-blue-200">
            <span className="text-gray-600">Karta:</span> 
            <span className="text-blue-700">{card.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold bg-gray-100 p-4 rounded-xl border border-gray-200">
            <span className="text-gray-600">Jami daromad:</span> 
            <span className="text-gray-800">{totalIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold bg-red-50 p-4 rounded-xl border border-red-200">
            <span className="text-red-600">Rasxodlar:</span> 
            <span className="text-red-700">{expenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-2xl font-black bg-gray-900 text-white p-6 rounded-2xl">
            <span>Sof foyda:</span> 
            <span>{netProfit.toLocaleString()}</span>
          </div>
        </div>
        <button onClick={onClose} className="mt-8 w-full bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold text-lg">Yopish</button>
      </div>
    </div>
  );
}
export default Bunner;