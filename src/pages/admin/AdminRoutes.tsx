import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Route as RouteIcon, MapPin, Clock, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapView from '@/components/MapView';
import type { Route as RouteType, BusStop } from '@/lib/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function AdminRoutes() {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeName, setRouteName] = useState('');

  const [showStopForm, setShowStopForm] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [stopForm, setStopForm] = useState({
    name: '',
    lat: '',
    lng: '',
    waitTime: '',
    order: '',
  });

  const selectedRoute = routes.find(r => r.id === selectedRouteId) ?? routes[0];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
        const res = await fetch(`${API_BASE}/api/routes`);
        const data = await res.json();
        setRoutes(data);
        if (data.length > 0 && !selectedRouteId) {
          setSelectedRouteId(data[0].id);
        }
        setError(null);
      } catch (e) {
        setError('Failed to load routes from server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedRouteId]);

  const openNewRouteForm = () => {
    setRouteName('');
    setShowRouteForm(true);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: routeName.trim() }),
      });
      const newRoute: RouteType = await res.json();
      setRoutes(prev => [...prev, newRoute]);
      setSelectedRouteId(newRoute.id);
      setShowRouteForm(false);
      setRouteName('');
    } catch {
      setError('Failed to create route.');
    }
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/routes/${id}`, { method: 'DELETE' });
      setRoutes(prev => {
        const filtered = prev.filter(r => r.id !== id);
        if (selectedRouteId === id && filtered.length > 0) {
          setSelectedRouteId(filtered[0].id);
        }
        return filtered;
      });
    } catch {
      setError('Failed to delete route.');
    }
  };

  const openNewStopForm = () => {
    setEditingStop(null);
    setStopForm({
      name: '',
      lat: '',
      lng: '',
      waitTime: '',
      order: String((selectedRoute?.stops.length ?? 0) + 1),
    });
    setShowStopForm(true);
  };

  const openEditStopForm = (stop: BusStop) => {
    setEditingStop(stop);
    setStopForm({
      name: stop.name,
      lat: String(stop.lat),
      lng: String(stop.lng),
      waitTime: String(stop.waitTime),
      order: String(stop.order),
    });
    setShowStopForm(true);
  };

  const handleSaveStop = async () => {
    if (!selectedRoute) return;
    if (!stopForm.name.trim()) return;

    const lat = Number(stopForm.lat);
    const lng = Number(stopForm.lng);
    const waitTime = Number(stopForm.waitTime || 0);
    const order = Number(stopForm.order || (selectedRoute.stops.length + 1));

    try {
      if (editingStop) {
        const res = await fetch(`${API_BASE}/api/stops/${editingStop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: stopForm.name.trim(),
            lat,
            lng,
            waitTime,
            order,
          }),
        });
        const updated: BusStop = await res.json();
        setRoutes(prev =>
          prev.map(route =>
            route.id === selectedRoute.id
              ? {
                  ...route,
                  stops: route.stops.map(s => (s.id === updated.id ? updated : s)),
                }
              : route
          )
        );
      } else {
        const res = await fetch(`${API_BASE}/api/routes/${selectedRoute.id}/stops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: stopForm.name.trim(),
            lat,
            lng,
            waitTime,
            order,
          }),
        });
        const created: BusStop = await res.json();
        setRoutes(prev =>
          prev.map(route =>
            route.id === selectedRoute.id
              ? { ...route, stops: [...route.stops, created] }
              : route
          )
        );
      }
      setShowStopForm(false);
      setEditingStop(null);
    } catch {
      setError('Failed to save stop.');
    }
  };

  const handleDeleteStop = async (id: string) => {
    if (!selectedRoute) return;
    try {
      await fetch(`${API_BASE}/api/stops/${id}`, { method: 'DELETE' });
      setRoutes(prev =>
        prev.map(route =>
          route.id === selectedRoute.id
            ? { ...route, stops: route.stops.filter(s => s.id !== id) }
            : route
        )
      );
    } catch {
      setError('Failed to delete stop.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-primary" />
          Routes
        </h1>
        <Button
          size="sm"
          className="rounded-xl gap-2"
          onClick={openNewRouteForm}
        >
          <Plus className="w-4 h-4" /> Add Route
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {loading && <span className="text-xs text-muted-foreground">Loading routes...</span>}
        {error && !loading && (
          <span className="text-xs text-destructive">{error}</span>
        )}
        {routes.map(r => (
          <div key={r.id} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedRouteId(r.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedRoute?.id === r.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {r.name}
            </button>
            <button
              onClick={() => handleDeleteRoute(r.id)}
              className="text-xs text-muted-foreground hover:text-destructive px-1"
              title="Delete route"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {showRouteForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold">Add New Route</h3>
            <button onClick={() => setShowRouteForm(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            placeholder="Route name (e.g. Kanhangad to Campus)"
            value={routeName}
            onChange={e => setRouteName(e.target.value)}
            className="rounded-xl"
          />
          <Button onClick={handleSaveRoute} className="rounded-xl self-end">
            Save Route
          </Button>
        </motion.div>
      )}

      {selectedRoute && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">Bus Stops</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={openNewStopForm}
                >
                  <Plus className="w-4 h-4" /> Add Stop
                </Button>
              </div>

              <div className="space-y-1">
                {selectedRoute.stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          i === 0
                            ? 'bg-success'
                            : i === selectedRoute.stops.length - 1
                            ? 'bg-destructive'
                            : 'bg-primary'
                        }`}
                      />
                      {i < selectedRoute.stops.length - 1 && (
                        <div className="w-0.5 h-6 bg-border" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stop.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Wait: {stop.waitTime} min
                      </p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Lat: {stop.lat.toFixed(4)} · Lng: {stop.lng.toFixed(4)} · Order: {stop.order}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openEditStopForm(stop)}
                        className="p-1.5 rounded-lg hover:bg-muted"
                        title="Edit stop"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStop(stop.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                        title="Delete stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showStopForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">
                    {editingStop ? 'Edit Stop' : 'Add New Stop'}
                  </h3>
                  <button onClick={() => setShowStopForm(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  placeholder="Stop name"
                  value={stopForm.name}
                  onChange={e => setStopForm({ ...stopForm, name: e.target.value })}
                  className="rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Latitude"
                    value={stopForm.lat}
                    onChange={e => setStopForm({ ...stopForm, lat: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Longitude"
                    value={stopForm.lng}
                    onChange={e => setStopForm({ ...stopForm, lng: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Wait time (min)"
                    type="number"
                    value={stopForm.waitTime}
                    onChange={e => setStopForm({ ...stopForm, waitTime: e.target.value })}
                    className="rounded-xl"
                  />
                  <Input
                    placeholder="Order"
                    type="number"
                    value={stopForm.order}
                    onChange={e => setStopForm({ ...stopForm, order: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <Button onClick={handleSaveStop} className="w-full rounded-xl">
                  Save Stop
                </Button>
              </motion.div>
            )}
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-display font-semibold mb-3">Route Map</h3>
            <MapView stops={selectedRoute.stops} height="350px" />
          </div>
        </div>
      )}
    </div>
  );
}
