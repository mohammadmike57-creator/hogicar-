import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supplierApi } from '../lib/api';
import type { Car, RateTemplate, Season, RateTier } from '../types';

export default function SupplierDashboard() {
  const { user, supplier, loading: authLoading } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [templates, setTemplates] = useState<RateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RateTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RateTemplate | null>(null);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [editingTier, setEditingTier] = useState<RateTier | null>(null);

  const [carForm, setCarForm] = useState({
    name: '',
    make: '',
    model: '',
    category: '',
    transmission: '',
    fuelPolicy: '',
    passengers: 4,
    doors: 4,
    bags: 2,
    price: 49.99,
    imageUrl: '',
    locationCode: '',
    locationName: '',
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    locationCode: '',
    locationName: '',
  });

  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const [tierForm, setTierForm] = useState({
    minDays: 1,
    maxDays: 30,
    dailyRate: 49.99,
  });

  useEffect(() => {
    if (supplier?.id) {
      loadData();
    }
  }, [supplier]);

  const loadData = async () => {
    if (!supplier?.id) return;
    setLoading(true);
    try {
      const [carsData, templatesData] = await Promise.all([
        supplierApi.getCars(),
        supplierApi.getRateTemplates(),
      ]);
      setCars(carsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: carForm.name,
        brand: carForm.make,
        model: carForm.model,
        category: carForm.category,
        transmission: carForm.transmission,
        fuel_policy: carForm.fuelPolicy,
        seats: carForm.passengers,
        doors: carForm.doors,
        luggage: carForm.bags,
        price: carForm.price,
        supplier_id: supplier?.id,
        image_url: carForm.imageUrl,
        currency: 'USD',
        location_code: carForm.locationCode,
        location_name: carForm.locationName,
      };
      if (editingCar) {
        await supplierApi.updateCar(editingCar.id, payload);
      } else {
        await supplierApi.createCar(payload);
      }
      setShowCarModal(false);
      resetCarForm();
      loadData();
    } catch (error) {
      console.error('Failed to save car:', error);
      alert('Failed to save car. Check console.');
    }
  };

  const deleteCar = async (id: number) => {
    if (confirm('Delete this car?')) {
      await supplierApi.deleteCar(id);
      loadData();
    }
  };

  const resetCarForm = () => {
    setCarForm({
      name: '',
      make: '',
      model: '',
      category: '',
      transmission: '',
      fuelPolicy: '',
      passengers: 4,
      doors: 4,
      bags: 2,
      price: 49.99,
      imageUrl: '',
      locationCode: '',
      locationName: '',
    });
    setEditingCar(null);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: templateForm.name,
        supplier_id: supplier?.id,
        location_code: templateForm.locationCode || null,
        location_name: templateForm.locationName || null,
      };
      if (editingTemplate) {
        await supplierApi.updateRateTemplate(editingTemplate.id, payload);
      } else {
        await supplierApi.createRateTemplate(payload);
      }
      setShowRateModal(false);
      resetTemplateForm();
      loadData();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const deleteTemplate = async (id: number) => {
    if (confirm('Delete this rate template? All seasons and tiers will be deleted.')) {
      await supplierApi.deleteRateTemplate(id);
      loadData();
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', locationCode: '', locationName: '' });
    setEditingTemplate(null);
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    try {
      const payload = {
        name: seasonForm.name,
        template_id: selectedTemplate.id,
        start_date: seasonForm.startDate,
        end_date: seasonForm.endDate,
        is_active: seasonForm.isActive,
      };
      if (editingSeason) {
        await supplierApi.updateSeason(editingSeason.id, payload);
      } else {
        await supplierApi.createSeason(payload);
      }
      setShowSeasonModal(false);
      resetSeasonForm();
      loadData();
    } catch (error) {
      console.error('Failed to save season:', error);
      alert('Failed to save season');
    }
  };

  const deleteSeason = async (id: number) => {
    if (confirm('Delete this season?')) {
      await supplierApi.deleteSeason(id);
      loadData();
    }
  };

  const resetSeasonForm = () => {
    setSeasonForm({ name: '', startDate: '', endDate: '', isActive: true });
    setEditingSeason(null);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !selectedTemplate.seasons?.length) {
      alert('Select a season first');
      return;
    }
    const seasonId = selectedTemplate.seasons[0].id;
    try {
      const payload = {
        season_id: seasonId,
        min_days: tierForm.minDays,
        max_days: tierForm.maxDays,
        daily_rate: tierForm.dailyRate,
      };
      if (editingTier) {
        await supplierApi.updateRateTier(editingTier.id, payload);
      } else {
        await supplierApi.createRateTier(payload);
      }
      setShowTierModal(false);
      resetTierForm();
      loadData();
    } catch (error) {
      console.error('Failed to save tier:', error);
      alert('Failed to save tier');
    }
  };

  const deleteTier = async (id: number) => {
    if (confirm('Delete this rate tier?')) {
      await supplierApi.deleteRateTier(id);
      loadData();
    }
  };

  const resetTierForm = () => {
    setTierForm({ minDays: 1, maxDays: 30, dailyRate: 49.99 });
    setEditingTier(null);
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!supplier) {
    return <div className="p-8 text-center text-red-600">Supplier not found. Please contact admin.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Supplier Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome, {supplier.name}</p>

      {/* Cars Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Fleet</h2>
          <button
            onClick={() => {
              resetCarForm();
              setEditingCar(null);
              setShowCarModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Car
          </button>
        </div>
        {cars.length === 0 ? (
          <p className="text-gray-500">No cars yet. Click "Add Car" to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="border rounded-lg p-4 shadow-sm">
                {car.image_url && (
                  <img src={car.image_url} alt={car.name} className="w-full h-40 object-cover rounded mb-3" />
                )}
                <h3 className="text-xl font-semibold">{car.name}</h3>
                <p className="text-gray-600">{car.brand} {car.model}</p>
                <p className="text-sm text-gray-500">{car.category} · {car.transmission}</p>
                <p className="text-sm">Seats: {car.seats} · Doors: {car.doors} · Luggage: {car.luggage}</p>
                <p className="text-sm text-blue-600">Location: {car.location_name || car.location_code || 'Any'}</p>
                <p className="text-lg font-bold mt-2">${car.price}/day</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingCar(car);
                      setCarForm({
                        name: car.name,
                        make: car.brand,
                        model: car.model,
                        category: car.category,
                        transmission: car.transmission,
                        fuelPolicy: car.fuel_policy,
                        passengers: car.seats,
                        doors: car.doors,
                        bags: car.luggage,
                        price: car.price,
                        imageUrl: car.image_url || '',
                        locationCode: car.location_code || '',
                        locationName: car.location_name || '',
                      });
                      setShowCarModal(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteCar(car.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate Templates Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Rate Templates</h2>
          <button
            onClick={() => {
              resetTemplateForm();
              setEditingTemplate(null);
              setShowRateModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + Create Rate Template
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-gray-500">No rate templates. Create one to define pricing seasons and daily rates.</p>
        ) : (
          <div className="space-y-6">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-500">
                      Location: {template.location_name || template.location_code || 'All locations'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          locationCode: template.location_code || '',
                          locationName: template.location_name || '',
                        });
                        setShowRateModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteTemplate(template.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Seasons */}
                <div className="mt-4 ml-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Seasons</h4>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        resetSeasonForm();
                        setEditingSeason(null);
                        setShowSeasonModal(true);
                      }}
                      className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      + Add Season
                    </button>
                  </div>
                  {template.seasons?.length === 0 ? (
                    <p className="text-sm text-gray-400">No seasons defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {template.seasons?.map((season) => (
                        <div key={season.id} className="border-l-2 pl-3 py-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{season.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setEditingSeason(season);
                                  setSeasonForm({
                                    name: season.name,
                                    startDate: season.start_date.slice(0, 10),
                                    endDate: season.end_date.slice(0, 10),
                                    isActive: season.is_active,
                                  });
                                  setShowSeasonModal(true);
                                }}
                                className="text-xs text-blue-600"
                              >
                                Edit
                              </button>
                              <button onClick={() => deleteSeason(season.id)} className="text-xs text-red-600">
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {season.start_date} → {season.end_date} {season.is_active ? '(Active)' : '(Inactive)'}
                          </p>
                          {/* Rate Tiers */}
                          <div className="ml-4 mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Daily rates</span>
                              <button
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  resetTierForm();
                                  setEditingTier(null);
                                  setShowTierModal(true);
                                }}
                                className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                              >
                                + Add Tier
                              </button>
                            </div>
                            {season.rate_tiers?.length === 0 ? (
                              <p className="text-xs text-gray-400">No rate tiers.</p>
                            ) : (
                              <table className="text-xs w-full">
                                <thead>
                                  <tr><th className="text-left">Min days</th><th>Max days</th><th>Daily rate</th><th></th></tr>
                                </thead>
                                <tbody>
                                  {season.rate_tiers?.map((tier) => (
                                    <tr key={tier.id}>
                                      <td>{tier.min_days}</td>
                                      <td>{tier.max_days}</td>
                                      <td>${tier.daily_rate}</td>
                                      <td>
                                        <button
                                          onClick={() => {
                                            setSelectedTemplate(template);
                                            setEditingTier(tier);
                                            setTierForm({
                                              minDays: tier.min_days,
                                              maxDays: tier.max_days,
                                              dailyRate: tier.daily_rate,
                                            });
                                            setShowTierModal(true);
                                          }}
                                          className="text-blue-600 mr-2"
                                        >
                                          Edit
                                        </button>
                                        <button onClick={() => deleteTier(tier.id)} className="text-red-600">
                                          Del
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ----- MODALS ----- */}

      {showCarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingCar ? 'Edit Car' : 'Add New Car'}</h3>
            <form onSubmit={handleCarSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Car Name (e.g., Toyota Camry)" value={carForm.name} onChange={e => setCarForm({...carForm, name: e.target.value})} className="border p-2 rounded" required />
                <input type="text" placeholder="Make (Brand)" value={carForm.make} onChange={e => setCarForm({...carForm, make: e.target.value})} className="border p-2 rounded" required />
                <input type="text" placeholder="Model" value={carForm.model} onChange={e => setCarForm({...carForm, model: e.target.value})} className="border p-2 rounded" required />
                <select value={carForm.category} onChange={e => setCarForm({...carForm, category: e.target.value})} className="border p-2 rounded">
                  <option value="Economy">Economy</option><option value="Compact">Compact</option><option value="Midsize">Midsize</option><option value="SUV">SUV</option><option value="Luxury">Luxury</option>
                </select>
                <select value={carForm.transmission} onChange={e => setCarForm({...carForm, transmission: e.target.value})} className="border p-2 rounded">
                  <option value="Automatic">Automatic</option><option value="Manual">Manual</option>
                </select>
                <select value={carForm.fuelPolicy} onChange={e => setCarForm({...carForm, fuelPolicy: e.target.value})} className="border p-2 rounded">
                  <option value="FULL_TO_FULL">Full to Full</option><option value="FULL_TO_EMPTY">Full to Empty</option>
                </select>
                <input type="number" placeholder="Seats" value={carForm.passengers} onChange={e => setCarForm({...carForm, passengers: parseInt(e.target.value)})} className="border p-2 rounded" required />
                <input type="number" placeholder="Doors" value={carForm.doors} onChange={e => setCarForm({...carForm, doors: parseInt(e.target.value)})} className="border p-2 rounded" required />
                <input type="number" placeholder="Luggage (bags)" value={carForm.bags} onChange={e => setCarForm({...carForm, bags: parseInt(e.target.value)})} className="border p-2 rounded" required />
                <input type="number" step="0.01" placeholder="Price per day (USD)" value={carForm.price} onChange={e => setCarForm({...carForm, price: parseFloat(e.target.value)})} className="border p-2 rounded" required />
                <input type="text" placeholder="Image URL" value={carForm.imageUrl} onChange={e => setCarForm({...carForm, imageUrl: e.target.value})} className="border p-2 rounded col-span-2" />
                <input type="text" placeholder="Location Code (e.g., AMM, DXB)" value={carForm.locationCode} onChange={e => setCarForm({...carForm, locationCode: e.target.value})} className="border p-2 rounded" />
                <input type="text" placeholder="Location Name (e.g., Amman, Dubai)" value={carForm.locationName} onChange={e => setCarForm({...carForm, locationName: e.target.value})} className="border p-2 rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowCarModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Car</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{editingTemplate ? 'Edit Rate Template' : 'Create Rate Template'}</h3>
            <form onSubmit={handleTemplateSubmit}>
              <input type="text" placeholder="Template Name (e.g., Standard Rates)" value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} className="border p-2 rounded w-full mb-2" required />
              <input type="text" placeholder="Location Code (optional, e.g., AMM)" value={templateForm.locationCode} onChange={e => setTemplateForm({...templateForm, locationCode: e.target.value})} className="border p-2 rounded w-full mb-2" />
              <input type="text" placeholder="Location Name (optional)" value={templateForm.locationName} onChange={e => setTemplateForm({...templateForm, locationName: e.target.value})} className="border p-2 rounded w-full mb-4" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRateModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSeasonModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{editingSeason ? 'Edit Season' : 'Add Season'}</h3>
            <form onSubmit={handleSeasonSubmit}>
              <input type="text" placeholder="Season Name (e.g., Summer 2025)" value={seasonForm.name} onChange={e => setSeasonForm({...seasonForm, name: e.target.value})} className="border p-2 rounded w-full mb-2" required />
              <input type="date" value={seasonForm.startDate} onChange={e => setSeasonForm({...seasonForm, startDate: e.target.value})} className="border p-2 rounded w-full mb-2" required />
              <input type="date" value={seasonForm.endDate} onChange={e => setSeasonForm({...seasonForm, endDate: e.target.value})} className="border p-2 rounded w-full mb-2" required />
              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={seasonForm.isActive} onChange={e => setSeasonForm({...seasonForm, isActive: e.target.checked})} />
                Active season
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSeasonModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save Season</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTierModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{editingTier ? 'Edit Rate Tier' : 'Add Rate Tier'}</h3>
            <form onSubmit={handleTierSubmit}>
              <input type="number" placeholder="Min days" value={tierForm.minDays} onChange={e => setTierForm({...tierForm, minDays: parseInt(e.target.value)})} className="border p-2 rounded w-full mb-2" required />
              <input type="number" placeholder="Max days (0 = unlimited)" value={tierForm.maxDays} onChange={e => setTierForm({...tierForm, maxDays: parseInt(e.target.value)})} className="border p-2 rounded w-full mb-2" required />
              <input type="number" step="0.01" placeholder="Daily rate (USD)" value={tierForm.dailyRate} onChange={e => setTierForm({...tierForm, dailyRate: parseFloat(e.target.value)})} className="border p-2 rounded w-full mb-4" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowTierModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save Tier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
