const BookingsContent = () => {
  const [filter, setFilter] = useState('all');
  const filteredBookings = MOCK_BOOKINGS.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <SectionHeader title="All Bookings" subtitle="Manage all rental bookings" icon={Calendar} />
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-gray-50/50">
            <tr className="text-xs font-semibold text-gray-500">
              <th className="p-3 border-b border-gray-200">Ref</th>
              <th className="p-3 border-b border-gray-200">Customer</th>
              <th className="p-3 border-b border-gray-200">Supplier</th>
              <th className="p-3 border-b border-gray-200">Vehicle</th>
              <th className="p-3 border-b border-gray-200">Dates</th>
              <th className="p-3 border-b border-gray-200">Total</th>
              <th className="p-3 border-b border-gray-200">Status</th>
              <th className="p-3 border-b border-gray-200">Rejection Reason</th>
              <th className="p-3 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.map(booking => (
              <tr key={booking.id} className="hover:bg-orange-50/50">
                <td className="p-3 font-mono text-sm text-gray-900">{booking.id}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-800">{booking.customerName}</div>
                  <div className="text-xs text-gray-500">{booking.email}</div>
                </td>
                <td className="p-3 text-gray-600">{booking.supplier}</td>
                <td className="p-3 text-gray-600">{booking.car}</td>
                <td className="p-3 text-gray-600">
                  {booking.startDate} – {booking.endDate}
                </td>
                <td className="p-3 font-semibold text-gray-800">${booking.total}</td>
                <td className="p-3">
                  <Badge status={booking.status} />
                </td>
                <td className="p-3 text-gray-600">
                  {booking.status === 'cancelled' && booking.rejectionReason ? (
                    <span className="text-sm text-red-600">{booking.rejectionReason}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
