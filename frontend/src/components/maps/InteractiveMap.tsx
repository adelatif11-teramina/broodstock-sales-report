'use client';

import React from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, DollarSign, Package, Navigation, Compass } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface InteractiveMapProps {
  timeRange?: string;
  className?: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  revenue: number;
  orderCount: number;
  customerTier: 'basic' | 'standard' | 'premium' | 'enterprise';
  city: string;
  country: string;
  lastOrderDate: string;
}

// Mock customer location data
const mockCustomerLocations: CustomerLocation[] = [
  {
    id: '1',
    name: 'AquaTech Solutions',
    latitude: 13.7563,
    longitude: 100.5018,
    revenue: 89000,
    orderCount: 24,
    customerTier: 'enterprise',
    city: 'Bangkok',
    country: 'Thailand',
    lastOrderDate: '2025-01-15',
  },
  {
    id: '2',
    name: 'Pacific Farms Co.',
    latitude: 14.5995,
    longitude: 120.9842,
    revenue: 76000,
    orderCount: 18,
    customerTier: 'premium',
    city: 'Manila',
    country: 'Philippines',
    lastOrderDate: '2025-01-10',
  },
  {
    id: '3',
    name: 'Blue Ocean Industries',
    latitude: 10.8231,
    longitude: 106.6297,
    revenue: 68000,
    orderCount: 32,
    customerTier: 'standard',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    lastOrderDate: '2025-01-12',
  },
  {
    id: '4',
    name: 'Coastal Aquaculture',
    latitude: 18.7883,
    longitude: 98.9853,
    revenue: 54000,
    orderCount: 15,
    customerTier: 'premium',
    city: 'Chiang Mai',
    country: 'Thailand',
    lastOrderDate: '2025-01-08',
  },
  {
    id: '5',
    name: 'Marine Harvest Ltd.',
    latitude: 10.3157,
    longitude: 123.8854,
    revenue: 49000,
    orderCount: 21,
    customerTier: 'standard',
    city: 'Cebu',
    country: 'Philippines',
    lastOrderDate: '2025-01-14',
  },
  {
    id: '6',
    name: 'Southeast Shrimp Co.',
    latitude: -6.2088,
    longitude: 106.8456,
    revenue: 42000,
    orderCount: 12,
    customerTier: 'standard',
    city: 'Jakarta',
    country: 'Indonesia',
    lastOrderDate: '2025-01-05',
  },
  {
    id: '7',
    name: 'Tropical Aqua Systems',
    latitude: 3.1390,
    longitude: 101.6869,
    revenue: 38000,
    orderCount: 14,
    customerTier: 'standard',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    lastOrderDate: '2025-01-11',
  },
  {
    id: '8',
    name: 'Delta Aquaculture',
    latitude: 21.0285,
    longitude: 105.8542,
    revenue: 33000,
    orderCount: 9,
    customerTier: 'basic',
    city: 'Hanoi',
    country: 'Vietnam',
    lastOrderDate: '2025-01-07',
  },
];

export default function InteractiveMap({ timeRange = '30d', className = '' }: InteractiveMapProps) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<maplibregl.Map | null>(null);
  const mapReady = React.useRef(false);
  const [mapStyle, setMapStyle] = React.useState<'streets' | 'satellite' | 'nautical'>('streets');

  // Fetch customer locations from API
  const { data: locationData, isLoading, error } = useQuery({
    queryKey: [...queryKeys.customerLocations, { timeRange }],
    queryFn: () => apiClient.getCustomerLocations({ limit: 100 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use API data if available, otherwise fallback to mock data
  const customerLocations = React.useMemo(() => {
    if (locationData?.locations && locationData.locations.length > 0) {
      return locationData.locations.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        revenue: loc.revenue,
        orderCount: loc.orderCount,
        customerTier: loc.customerTier,
        city: loc.city,
        country: loc.country,
        lastOrderDate: loc.lastOrderDate,
        credentialStatus: loc.credentialStatus,
        status: loc.status,
      }));
    }
    return mockCustomerLocations;
  }, [locationData]);

  const mapApiKey = (process.env.NEXT_PUBLIC_MAP_API_KEY || '').trim();

  const mapStyleCatalog = React.useMemo(() => {
    const keySuffix = mapApiKey ? `?key=${mapApiKey}` : '';

    return {
      streets:
        process.env.NEXT_PUBLIC_MAP_STYLE_STREETS ||
        `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`,
      satellite:
        process.env.NEXT_PUBLIC_MAP_STYLE_SATELLITE ||
        (mapApiKey
          ? `https://api.maptiler.com/maps/satellite/style.json${keySuffix}`
          : `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`),
      nautical:
        process.env.NEXT_PUBLIC_MAP_STYLE_NAUTICAL ||
        (mapApiKey
          ? `https://api.maptiler.com/maps/hybrid/style.json${keySuffix}`
          : `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`),
    } as const;
  }, [mapApiKey]);

  const currentStyleUrl = mapStyleCatalog[mapStyle];

  // Initialize map once container has a real size
  React.useEffect(() => {
    const container = mapContainer.current;
    if (!container || map.current) return;

    let resizeObserver: ResizeObserver | null = null;

    const instantiateMap = () => {
      if (map.current || !mapContainer.current) return;

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: currentStyleUrl,
        center: [106.8456, 10.8231],
        zoom: 4,
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      map.current.on('load', () => {
        mapReady.current = true;
        requestAnimationFrame(() => map.current?.resize());
        window.setTimeout(() => map.current?.resize(), 250);
      });
    };

    const { width, height } = container.getBoundingClientRect();
    if (width > 32 && height > 32) {
      instantiateMap();
    } else {
      resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry.contentRect.width > 32 && entry.contentRect.height > 32) {
          instantiateMap();
          if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapReady.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to map style changes
  React.useEffect(() => {
    if (!map.current || !currentStyleUrl) return;
    mapReady.current = false;
    map.current.setStyle(currentStyleUrl);
    map.current.once('styledata', () => {
      mapReady.current = true;
      requestAnimationFrame(() => map.current?.resize());
      window.setTimeout(() => map.current?.resize(), 250);
      if (mapContainer.current) {
        const rect = mapContainer.current.getBoundingClientRect();
        console.debug('[Map] container size after style change', rect.width, rect.height);
      }
    });
  }, [currentStyleUrl]);

  React.useEffect(() => {
    if (!map.current || !mapContainer.current) return;

    const handleResize = () => {
      requestAnimationFrame(() => map.current?.resize());
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mapContainer.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add customer markers
  React.useEffect(() => {
    if (!map.current || !customerLocations || isLoading || !mapReady.current) return;

    const markers: maplibregl.Marker[] = [];

    customerLocations.forEach((customer: any) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'customer-marker';
      el.style.cssText = `
        width: ${getMarkerSize(customer.revenue)}px;
        height: ${getMarkerSize(customer.revenue)}px;
        background-color: ${getTierColor(customer.customerTier)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 12px 20px -10px rgba(31, 43, 109, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
        transition: transform 0.2s;
      `;
      el.textContent = customer.orderCount.toString();

      // Add hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.12)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create marker
      const marker = new maplibregl.Marker(el)
        .setLngLat([customer.longitude, customer.latitude])
        .addTo(map.current!);

      markers.push(marker);
    });

    if (customerLocations.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      customerLocations.forEach((customer: any) => {
        bounds.extend([customer.longitude, customer.latitude]);
      });

      const padding = Math.min(window.innerWidth * 0.1, 120);
      map.current.fitBounds(bounds, {
        padding,
        duration: 1000,
        maxZoom: 7.5,
      });
      requestAnimationFrame(() => map.current?.resize());
      if (mapContainer.current) {
        const rect = mapContainer.current.getBoundingClientRect();
        console.debug('[Map] container size during fitBounds', rect.width, rect.height);
      }
    }

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [customerLocations, isLoading]);

  // Helper functions
  const getMarkerSize = (revenue: number) => {
    if (revenue > 70000) return 28;
    if (revenue > 50000) return 24;
    if (revenue > 30000) return 20;
    return 16;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return '#b02a24';
      case 'premium':
        return '#2f4ec8';
      case 'standard':
        return '#1b2554';
      case 'basic':
        return '#a35a00';
      default:
        return '#6b7280';
    }
  };

  const flyToLocation = (lat: number, lng: number) => {
    map.current?.flyTo({
      center: [lng, lat],
      zoom: 8,
      duration: 1000,
    });
  };

  const totalRevenue = customerLocations?.reduce((sum: number, customer: any) => sum + customer.revenue, 0) || 0;
  const totalCustomers = customerLocations?.length || 0;
  const totalOrders = customerLocations?.reduce((sum: number, customer: any) => sum + customer.orderCount, 0) || 0;

  return (
    <div className={`bg-white rounded-3xl border border-white/70 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/70 bg-gradient-to-r from-[var(--brand-navy)] via-[#1a2760] to-[var(--brand-blue)] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/90 rounded-2xl text-[var(--brand-blue)] shadow-md">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">Geo Intelligence</p>
              <h3 className="text-2xl font-extrabold">Customer Distribution Map</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5">
              <Compass className="h-4 w-4 text-white/70" />
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value as any)}
                className="bg-transparent text-xs font-semibold uppercase tracking-[0.3em] text-white focus:outline-none"
              >
                <option value="streets">Streets</option>
                <option value="satellite">Satellite</option>
                <option value="nautical">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 text-[var(--brand-blue)] shadow">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.35em]">Revenue</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-navy)]">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 text-[var(--brand-blue)] shadow">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.35em]">Customers</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-navy)]">
              {formatNumber(totalCustomers)}
            </p>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 text-[var(--brand-blue)] shadow">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.35em]">Orders</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-navy)]">
              {formatNumber(totalOrders)}
            </p>
          </div>
          <div className="bg-white/85 border border-white/60 rounded-2xl p-4 text-[var(--brand-blue)] shadow">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.35em]">Countries</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--brand-navy)]">
              {new Set(customerLocations?.map((c: any) => c.country)).size || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full" style={{ minHeight: 380 }}>
        <div
          ref={mapContainer}
          className="map-container"
          style={{ height: '28rem', width: '100%' }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-[var(--brand-blue)] border-t-transparent"></div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/80 border border-white/60 rounded-2xl shadow-lg p-4 text-xs space-y-2" style={{ backdropFilter: 'blur(10px)' }}>
          <h4 className="font-semibold text-[var(--brand-navy)] uppercase tracking-[0.3em]">Customer tier</h4>
          <div className="space-y-2 text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#b02a24]"></span>
              <span>Enterprise</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#2f4ec8]"></span>
              <span>Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#1b2554]"></span>
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#ffb347]"></span>
              <span>Basic</span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/50 text-[var(--text-secondary)]">
            <p>Circle size reflects revenue</p>
            <p>Number shows 30-day orders</p>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="p-6 border-t border-white/60 bg-white/85">
        <h4 className="text-sm font-semibold text-[var(--brand-navy)] uppercase tracking-[0.3em] mb-4">Top customers</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
          {customerLocations?.slice(0, 8).map((customer: any) => (
            <div 
              key={customer.id}
              className="flex items-center justify-between p-3 bg-white border border-white/70 rounded-2xl hover:-translate-y-0.5 transition-transform cursor-pointer"
              onClick={() => flyToLocation(customer.latitude, customer.longitude)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getTierColor(customer.customerTier) }}
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">{customer.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{customer.city}, {customer.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--brand-blue)]">{formatCurrency(customer.revenue)}</p>
                <p className="text-xs text-[var(--text-secondary)]">{customer.orderCount} orders</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
