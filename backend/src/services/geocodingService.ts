import { config } from '../config/env';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  country?: string;
  province?: string;
  district?: string;
  confidence: number; // 0-1 confidence score
}

export interface ReverseGeocodingResult {
  formatted_address: string;
  country?: string;
  province?: string;
  district?: string;
}

export class GeocodingService {
  /**
   * Geocode an address using OpenStreetMap Nominatim (free service)
   */
  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    try {
      // Clean and encode the address
      const encodedAddress = encodeURIComponent(address.trim());
      
      // Use Nominatim API (free OpenStreetMap geocoding service)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&countrycodes=th,ph,vn,id,my,sg&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Broodstock-Sales-Platform/1.0 (https://example.com/contact)', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const results = await response.json() as any[];
      
      return results.map((result: any) => ({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        country: result.address?.country,
        province: result.address?.state || result.address?.province || result.address?.region,
        district: result.address?.county || result.address?.city || result.address?.town,
        confidence: parseFloat(result.importance || 0.5),
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodingResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Broodstock-Sales-Platform/1.0 (https://example.com/contact)',
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`);
      }

      const result = await response.json() as any;
      
      if (!result || (result as any).error) {
        return null;
      }

      return {
        formatted_address: (result as any).display_name,
        country: (result as any).address?.country,
        province: (result as any).address?.state || (result as any).address?.province || (result as any).address?.region,
        district: (result as any).address?.county || (result as any).address?.city || (result as any).address?.town,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with Google Maps API (if API key is provided)
   */
  async geocodeAddressGoogle(address: string): Promise<GeocodingResult[]> {
    if (!config.geocoding.apiKey || config.geocoding.provider !== 'google') {
      throw new Error('Google Geocoding API key not configured');
    }

    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${config.geocoding.apiKey}&region=th`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if ((data as any).status !== 'OK') {
        throw new Error(`Google Geocoding API status: ${(data as any).status}`);
      }

      return (data as any).results.map((result: any) => {
        const location = result.geometry.location;
        const components = result.address_components;
        
        // Extract address components
        let country, province, district;
        
        for (const component of components) {
          const types = component.types;
          if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            province = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
        }

        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address,
          country,
          province,
          district,
          confidence: 1.0, // Google generally has high confidence
        };
      });
    } catch (error) {
      console.error('Google geocoding error:', error);
      return [];
    }
  }

  /**
   * Main geocoding method that uses the configured provider
   */
  async geocode(address: string): Promise<GeocodingResult[]> {
    if (!address || address.trim().length === 0) {
      return [];
    }

    try {
      // Add rate limiting for free services
      if (config.geocoding.provider === 'openstreetmap' || !config.geocoding.provider) {
        // Nominatim rate limit: max 1 request per second
        await this.delay(1000);
        return await this.geocodeAddress(address);
      } else if (config.geocoding.provider === 'google') {
        return await this.geocodeAddressGoogle(address);
      } else {
        return await this.geocodeAddress(address); // Default to OSM
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      return [];
    }
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Simple delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Suggest address corrections based on geocoding results
   */
  async suggestAddressCorrections(
    inputAddress: string, 
    threshold: number = 0.7
  ): Promise<GeocodingResult[]> {
    const results = await this.geocode(inputAddress);
    
    // Filter results by confidence threshold
    return results.filter(result => result.confidence >= threshold);
  }

  /**
   * Batch geocode multiple addresses (with rate limiting)
   */
  async batchGeocode(
    addresses: string[], 
    batchSize: number = 5
  ): Promise<Map<string, GeocodingResult[]>> {
    const results = new Map<string, GeocodingResult[]>();
    
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      // Process batch in parallel but respect rate limits
      const batchPromises = batch.map(async (address, index) => {
        // Stagger requests within batch
        await this.delay(index * 200);
        const geocodeResults = await this.geocode(address);
        results.set(address, geocodeResults);
      });
      
      await Promise.all(batchPromises);
      
      // Wait between batches
      if (i + batchSize < addresses.length) {
        await this.delay(2000);
      }
    }
    
    return results;
  }
}

export const geocodingService = new GeocodingService();