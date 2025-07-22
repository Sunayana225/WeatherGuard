import axios from 'axios';
import { WeatherAlert, WeatherData, WeatherForecast } from '../../types';

interface WeatherAPIConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  rateLimit: {
    requestsPerMinute: number;
    lastReset: number;
    currentCount: number;
  };
}

class WeatherService {
  private apis: Record<string, WeatherAPIConfig> = {
    openweather: {
      name: 'OpenWeatherMap',
      baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
      apiKey: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
      timeout: 8000,
      rateLimit: { requestsPerMinute: 60, lastReset: Date.now(), currentCount: 0 }
    },
    weatherapi: {
      name: 'WeatherAPI',
      baseUrl: process.env.WEATHERAPI_BASE_URL || 'https://api.weatherapi.com/v1',
      apiKey: process.env.NEXT_PUBLIC_WEATHERAPI_KEY || '',
      timeout: 8000,
      rateLimit: { requestsPerMinute: 100, lastReset: Date.now(), currentCount: 0 }
    },
    nws: {
      name: 'National Weather Service',
      baseUrl: process.env.NWS_BASE_URL || 'https://api.weather.gov',
      timeout: 12000,
      rateLimit: { requestsPerMinute: 300, lastReset: Date.now(), currentCount: 0 }
    },
    // Additional global weather sources
    meteostat: {
      name: 'Meteostat',
      baseUrl: 'https://meteostat.p.rapidapi.com',
      apiKey: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
      timeout: 10000,
      rateLimit: { requestsPerMinute: 2000, lastReset: Date.now(), currentCount: 0 }
    },
    openmeteo: {
      name: 'Open-Meteo',
      baseUrl: 'https://api.open-meteo.com/v1',
      timeout: 8000,
      rateLimit: { requestsPerMinute: 10000, lastReset: Date.now(), currentCount: 0 }
    }
  };

  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private checkRateLimit(apiKey: string): boolean {
    const api = this.apis[apiKey];
    if (!api) return false;

    const now = Date.now();
    const minuteAgo = now - 60000;

    if (api.rateLimit.lastReset < minuteAgo) {
      api.rateLimit.lastReset = now;
      api.rateLimit.currentCount = 0;
    }

    if (api.rateLimit.currentCount >= api.rateLimit.requestsPerMinute) {
      return false;
    }

    api.rateLimit.currentCount++;
    return true;
  }

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = this.getCacheKey('current', { lat: latitude, lon: longitude });
    const cached = this.getFromCache<WeatherData>(cacheKey);
    if (cached) return cached;

    // Enhanced offline handling
    if (!navigator.onLine) {
      console.log('Offline mode: returning mock weather data for emergency use');
      return this.getMockWeatherData(latitude, longitude, ['Offline mode - using cached data']);
    }

    const errors: string[] = [];
    let lastError: Error | null = null;

    // Try OpenWeatherMap first
    if (this.checkRateLimit('openweather') && this.apis.openweather.apiKey) {
      try {
        const response = await axios.get(`${this.apis.openweather.baseUrl}/weather`, {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.apis.openweather.apiKey,
            units: 'imperial'
          },
          timeout: this.apis.openweather.timeout
        });

        const weatherData = this.transformOpenWeatherData(response.data, latitude, longitude);
        this.setCache(cacheKey, weatherData);
        console.log('OpenWeatherMap API succeeded');
        return weatherData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const errorMsg = `OpenWeatherMap: ${lastError.message}`;
        errors.push(errorMsg);
        console.warn('OpenWeatherMap API failed:', errorMsg);
      }
    }

    // Try WeatherAPI as fallback
    if (this.checkRateLimit('weatherapi') && this.apis.weatherapi.apiKey) {
      try {
        const response = await axios.get(`${this.apis.weatherapi.baseUrl}/current.json`, {
          params: {
            key: this.apis.weatherapi.apiKey,
            q: `${latitude},${longitude}`,
            aqi: 'yes'
          },
          timeout: this.apis.weatherapi.timeout
        });

        const weatherData = this.transformWeatherAPIData(response.data, latitude, longitude);
        this.setCache(cacheKey, weatherData);
        return weatherData;
      } catch (error) {
        errors.push(`WeatherAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Try Meteostat (RapidAPI)
    if (this.checkRateLimit('meteostat') && this.apis.meteostat.apiKey) {
      try {
        const weatherData = await this.fetchMeteostatCurrentWeather(latitude, longitude);
        this.setCache(cacheKey, weatherData);
        return weatherData;
      } catch (error) {
        errors.push(`Meteostat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Try Open-Meteo (free global weather API)
    if (this.checkRateLimit('openmeteo')) {
      try {
        const response = await axios.get(`${this.apis.openmeteo.baseUrl}/forecast`, {
          params: {
            latitude: latitude,
            longitude: longitude,
            current_weather: true,
            hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
            timezone: 'auto'
          },
          timeout: this.apis.openmeteo.timeout
        });

        const weatherData = this.transformOpenMeteoData(response.data, latitude, longitude);
        this.setCache(cacheKey, weatherData);
        return weatherData;
      } catch (error) {
        errors.push(`Open-Meteo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Try National Weather Service (US only)
    if (this.checkRateLimit('nws') && this.isUSLocation(latitude, longitude)) {
      try {
        const weatherData = await this.getNWSWeather(latitude, longitude);
        this.setCache(cacheKey, weatherData);
        return weatherData;
      } catch (error) {
        errors.push(`NWS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // If all APIs fail, return mock data with comprehensive error information
    console.warn('All weather APIs failed, returning mock data for emergency use');
    console.warn('API Errors:', errors);

    // Log error for monitoring in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Send error to monitoring service
      this.logWeatherApiFailure(latitude, longitude, errors, lastError);
    }

    return this.getMockWeatherData(latitude, longitude, errors);
  }

  async getWeatherForecast(latitude: number, longitude: number, days: number = 5): Promise<WeatherForecast[]> {
    const cacheKey = this.getCacheKey('forecast', { lat: latitude, lon: longitude, days });
    const cached = this.getFromCache<WeatherForecast[]>(cacheKey);
    if (cached) return cached;

    const errors: string[] = [];

    // Try OpenWeatherMap 5-day forecast
    if (this.checkRateLimit('openweather') && this.apis.openweather.apiKey) {
      try {
        const response = await axios.get(`${this.apis.openweather.baseUrl}/forecast`, {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.apis.openweather.apiKey,
            units: 'imperial',
            cnt: days * 8 // 8 forecasts per day (3-hour intervals)
          },
          timeout: this.apis.openweather.timeout
        });

        const forecast = this.transformOpenWeatherForecast(response.data);
        this.setCache(cacheKey, forecast);
        return forecast;
      } catch (error) {
        errors.push(`OpenWeatherMap Forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Try WeatherAPI forecast
    if (this.checkRateLimit('weatherapi') && this.apis.weatherapi.apiKey) {
      try {
        const response = await axios.get(`${this.apis.weatherapi.baseUrl}/forecast.json`, {
          params: {
            key: this.apis.weatherapi.apiKey,
            q: `${latitude},${longitude}`,
            days: Math.min(days, 10), // WeatherAPI supports up to 10 days
            aqi: 'no',
            alerts: 'no'
          },
          timeout: this.apis.weatherapi.timeout
        });

        const forecast = this.transformWeatherAPIForecast(response.data);
        this.setCache(cacheKey, forecast);
        return forecast;
      } catch (error) {
        errors.push(`WeatherAPI Forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return mock forecast data if all APIs fail
    return this.getMockForecastData(days, errors);
  }

  async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    const cacheKey = this.getCacheKey('alerts', { lat: latitude, lon: longitude });
    const cached = this.getFromCache<WeatherAlert[]>(cacheKey);
    if (cached) return cached;

    const alerts: WeatherAlert[] = [];

    // Try National Weather Service alerts (most reliable for US)
    if (this.checkRateLimit('nws')) {
      try {
        const nwsAlerts = await this.getNWSAlerts(latitude, longitude);
        alerts.push(...nwsAlerts);
      } catch (error) {
        console.error('Failed to fetch NWS alerts:', error);
      }
    }

    // Try WeatherAPI alerts as additional source
    if (this.checkRateLimit('weatherapi') && this.apis.weatherapi.apiKey) {
      try {
        const response = await axios.get(`${this.apis.weatherapi.baseUrl}/current.json`, {
          params: {
            key: this.apis.weatherapi.apiKey,
            q: `${latitude},${longitude}`,
            alerts: 'yes'
          },
          timeout: this.apis.weatherapi.timeout
        });

        if (response.data.alerts && response.data.alerts.alert) {
          const weatherApiAlerts = this.transformWeatherAPIAlerts(response.data.alerts.alert);
          alerts.push(...weatherApiAlerts);
        }
      } catch (error) {
        console.error('Failed to fetch WeatherAPI alerts:', error);
      }
    }

    this.setCache(cacheKey, alerts, 5 * 60 * 1000); // Cache alerts for 5 minutes
    return alerts;
  }

  private async getNWSWeather(latitude: number, longitude: number): Promise<WeatherData> {
    // Get grid point information
    const pointResponse = await axios.get(`${this.apis.nws.baseUrl}/points/${latitude},${longitude}`, {
      timeout: this.apis.nws.timeout,
      headers: { 'User-Agent': 'WeatherSafetyApp/1.0 (contact@example.com)' }
    });

    const { gridId, gridX, gridY } = pointResponse.data.properties;

    // Get current conditions from the nearest observation station
    const stationsResponse = await axios.get(`${this.apis.nws.baseUrl}/gridpoints/${gridId}/${gridX},${gridY}/stations`, {
      timeout: this.apis.nws.timeout,
      headers: { 'User-Agent': 'WeatherSafetyApp/1.0 (contact@example.com)' }
    });

    const stationId = stationsResponse.data.features[0]?.properties.stationIdentifier;
    
    if (stationId) {
      const observationResponse = await axios.get(`${this.apis.nws.baseUrl}/stations/${stationId}/observations/latest`, {
        timeout: this.apis.nws.timeout,
        headers: { 'User-Agent': 'WeatherSafetyApp/1.0 (contact@example.com)' }
      });

      return this.transformNWSData(observationResponse.data, latitude, longitude);
    }

    throw new Error('No observation station found for location');
  }

  private async getNWSAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(`${this.apis.nws.baseUrl}/alerts/active`, {
        params: {
          point: `${latitude},${longitude}`
        },
        timeout: this.apis.nws.timeout,
        headers: { 'User-Agent': 'WeatherSafetyApp/1.0 (contact@example.com)' }
      });

      return response.data.features.map((alert: any) => this.transformNWSAlert(alert));
    } catch (error) {
      console.error('Failed to fetch NWS alerts:', error);
      return [];
    }
  }

  // Meteostat API methods
  private async fetchMeteostatCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    // First, find nearby weather stations
    const stationsResponse = await axios.get(`${this.apis.meteostat.baseUrl}/stations/nearby`, {
      params: {
        lat: latitude,
        lon: longitude,
        limit: 1
      },
      headers: {
        'X-RapidAPI-Key': this.apis.meteostat.apiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      },
      timeout: this.apis.meteostat.timeout
    });

    if (!stationsResponse.data.data || stationsResponse.data.data.length === 0) {
      throw new Error('No nearby weather stations found');
    }

    const station = stationsResponse.data.data[0];
    const stationId = station.id;

    // Get current date for recent data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // Fetch recent daily data (most recent available)
    const weatherResponse = await axios.get(`${this.apis.meteostat.baseUrl}/stations/daily`, {
      params: {
        station: stationId,
        start: startDate,
        end: endDate
      },
      headers: {
        'X-RapidAPI-Key': this.apis.meteostat.apiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      },
      timeout: this.apis.meteostat.timeout
    });

    if (!weatherResponse.data.data || weatherResponse.data.data.length === 0) {
      throw new Error('No recent weather data available');
    }

    const recentData = weatherResponse.data.data[weatherResponse.data.data.length - 1];
    return this.transformMeteostatData(recentData, latitude, longitude, station);
  }

  private async fetchMeteostatMonthlyData(latitude: number, longitude: number, year: number, month: number): Promise<any> {
    // Find nearby weather stations
    const stationsResponse = await axios.get(`${this.apis.meteostat.baseUrl}/stations/nearby`, {
      params: {
        lat: latitude,
        lon: longitude,
        limit: 1
      },
      headers: {
        'X-RapidAPI-Key': this.apis.meteostat.apiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      },
      timeout: this.apis.meteostat.timeout
    });

    if (!stationsResponse.data.data || stationsResponse.data.data.length === 0) {
      throw new Error('No nearby weather stations found');
    }

    const station = stationsResponse.data.data[0];
    const stationId = station.id;

    // Format dates for the specific month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    // Fetch monthly data
    const monthlyResponse = await axios.get(`${this.apis.meteostat.baseUrl}/stations/monthly`, {
      params: {
        station: stationId,
        start: startDate,
        end: endDate
      },
      headers: {
        'X-RapidAPI-Key': this.apis.meteostat.apiKey,
        'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
      },
      timeout: this.apis.meteostat.timeout
    });

    return {
      station: station,
      data: monthlyResponse.data.data
    };
  }

  // Data transformation methods
  private transformOpenWeatherData(data: any, lat: number, lon: number): WeatherData {
    return {
      location: { lat, lon, name: data.name || 'Unknown Location' },
      current: {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1609.34) : 10,
        wind_speed: Math.round(data.wind?.speed || 0),
        wind_direction: data.wind?.deg || 0,
        weather: {
          main: data.weather[0]?.main || 'Unknown',
          description: data.weather[0]?.description || 'No description',
          icon: data.weather[0]?.icon || '01d'
        }
      }
    };
  }

  private transformWeatherAPIData(data: any, lat: number, lon: number): WeatherData {
    return {
      location: { lat, lon, name: data.location.name },
      current: {
        temp: Math.round(data.current.temp_f),
        feels_like: Math.round(data.current.feelslike_f),
        humidity: data.current.humidity,
        pressure: Math.round(data.current.pressure_mb),
        visibility: Math.round(data.current.vis_miles),
        wind_speed: Math.round(data.current.wind_mph),
        wind_direction: data.current.wind_degree,
        weather: {
          main: data.current.condition.text,
          description: data.current.condition.text,
          icon: '01d'
        }
      }
    };
  }

  private transformNWSData(data: any, lat: number, lon: number): WeatherData {
    const props = data.properties;
    return {
      location: { lat, lon, name: 'NWS Location' },
      current: {
        temp: props.temperature?.value ? Math.round((props.temperature.value * 9/5) + 32) : 70,
        feels_like: props.heatIndex?.value ? Math.round((props.heatIndex.value * 9/5) + 32) : 70,
        humidity: props.relativeHumidity?.value || 50,
        pressure: props.barometricPressure?.value ? Math.round(props.barometricPressure.value / 100) : 1013,
        visibility: props.visibility?.value ? Math.round(props.visibility.value / 1609.34) : 10,
        wind_speed: props.windSpeed?.value ? Math.round(props.windSpeed.value * 2.237) : 0,
        wind_direction: props.windDirection?.value || 0,
        weather: {
          main: props.textDescription || 'Clear',
          description: props.textDescription || 'Clear conditions',
          icon: '01d'
        }
      }
    };
  }

  private transformOpenWeatherForecast(data: any): WeatherForecast[] {
    return data.list.slice(0, 40).filter((_: any, index: number) => index % 8 === 0).map((item: any) => ({
      datetime: item.dt_txt,
      temp_max: Math.round(item.main.temp_max),
      temp_min: Math.round(item.main.temp_min),
      humidity: item.main.humidity,
      wind_speed: Math.round(item.wind.speed),
      weather: {
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      },
      precipitation_probability: Math.round((item.pop || 0) * 100)
    }));
  }

  private transformWeatherAPIForecast(data: any): WeatherForecast[] {
    return data.forecast.forecastday.map((day: any) => ({
      datetime: day.date,
      temp_max: Math.round(day.day.maxtemp_f),
      temp_min: Math.round(day.day.mintemp_f),
      humidity: day.day.avghumidity,
      wind_speed: Math.round(day.day.maxwind_mph),
      weather: {
        main: day.day.condition.text,
        description: day.day.condition.text,
        icon: '01d'
      },
      precipitation_probability: day.day.daily_chance_of_rain || 0
    }));
  }

  private transformNWSAlert(alert: any): WeatherAlert {
    const props = alert.properties;
    return {
      id: 0, // Will be set by database
      alert_id: props.id,
      type: props.event,
      severity: this.mapNWSSeverity(props.severity),
      title: props.headline,
      description: props.description,
      area_description: props.areaDesc,
      latitude: undefined,
      longitude: undefined,
      radius_km: undefined,
      start_time: props.onset,
      end_time: props.expires,
      created_at: new Date().toISOString(),
      is_active: true
    };
  }

  private transformWeatherAPIAlerts(alerts: any[]): WeatherAlert[] {
    return alerts.map(alert => ({
      id: 0,
      alert_id: `weatherapi_${Date.now()}_${Math.random()}`,
      type: alert.event || 'Weather Alert',
      severity: 'moderate' as const,
      title: alert.headline || alert.event,
      description: alert.desc || alert.instruction,
      area_description: alert.areas,
      latitude: undefined,
      longitude: undefined,
      radius_km: undefined,
      start_time: alert.effective,
      end_time: alert.expires,
      created_at: new Date().toISOString(),
      is_active: true
    }));
  }

  private mapNWSSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    switch (severity?.toLowerCase()) {
      case 'extreme': return 'extreme';
      case 'severe': return 'severe';
      case 'moderate': return 'moderate';
      default: return 'minor';
    }
  }

  private getMockWeatherData(latitude: number, longitude: number, errors: string[]): WeatherData {
    return {
      location: { lat: latitude, lon: longitude, name: 'Unknown Location' },
      current: {
        temp: 72,
        feels_like: 75,
        humidity: 50,
        pressure: 1013,
        visibility: 10,
        wind_speed: 5,
        wind_direction: 180,
        weather: {
          main: 'Unavailable',
          description: `Weather data temporarily unavailable. Errors: ${errors.join('; ')}`,
          icon: '01d'
        }
      },
      alerts: [{
        id: 0,
        alert_id: 'API_ERROR',
        type: 'System Alert',
        severity: 'minor',
        title: 'Weather Data Unavailable',
        description: `Unable to fetch weather data from external APIs. ${errors.join('; ')}`,
        created_at: new Date().toISOString(),
        is_active: true
      }]
    };
  }

  private getMockForecastData(days: number, errors: string[]): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        datetime: date.toISOString().split('T')[0],
        temp_max: 75 + Math.random() * 10,
        temp_min: 60 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        wind_speed: 5 + Math.random() * 10,
        weather: {
          main: 'Unavailable',
          description: 'Forecast data unavailable',
          icon: '01d'
        },
        precipitation_probability: Math.random() * 50
      });
    }
    return forecast;
  }

  // Transform Open-Meteo data to our format
  private transformOpenMeteoData(data: any, latitude: number, longitude: number): WeatherData {
    const current = data.current_weather;

    return {
      location: {
        lat: latitude,
        lon: longitude,
        name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      },
      current: {
        temp: this.celsiusToFahrenheit(current.temperature),
        feels_like: this.celsiusToFahrenheit(current.temperature), // Open-Meteo doesn't provide feels_like
        humidity: data.hourly?.relative_humidity_2m?.[0] || 50,
        pressure: 1013, // Default value as Open-Meteo doesn't provide pressure in free tier
        visibility: 10,
        wind_speed: this.kmhToMph(current.windspeed),
        wind_direction: current.winddirection,
        weather: {
          main: this.getWeatherFromWMO(current.weathercode),
          description: this.getWeatherDescriptionFromWMO(current.weathercode),
          icon: this.getIconFromWMO(current.weathercode)
        }
      }
    };
  }

  // Transform Meteostat data to our format
  private transformMeteostatData(data: any, latitude: number, longitude: number, station: any): WeatherData {
    return {
      location: {
        lat: latitude,
        lon: longitude,
        name: station.name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      },
      current: {
        temp: data.tavg ? this.celsiusToFahrenheit(data.tavg) : (data.tmax ? this.celsiusToFahrenheit(data.tmax) : 70),
        feels_like: data.tavg ? this.celsiusToFahrenheit(data.tavg) : (data.tmax ? this.celsiusToFahrenheit(data.tmax) : 70),
        humidity: 50, // Meteostat daily data doesn't include humidity
        pressure: data.pres || 1013,
        visibility: 10, // Default value
        wind_speed: data.wspd ? this.kmhToMph(data.wspd) : 0,
        wind_direction: data.wdir || 0,
        weather: {
          main: this.getWeatherFromMeteostat(data),
          description: this.getWeatherDescriptionFromMeteostat(data),
          icon: this.getIconFromMeteostat(data)
        }
      }
    };
  }

  // Utility functions for Open-Meteo
  private celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
  }

  private kmhToMph(kmh: number): number {
    return kmh * 0.621371;
  }

  private getWeatherFromWMO(code: number): string {
    const wmoMap: Record<number, string> = {
      0: 'Clear',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Hail',
      99: 'Thunderstorm with Heavy Hail'
    };
    return wmoMap[code] || 'Unknown';
  }

  private getWeatherDescriptionFromWMO(code: number): string {
    const descriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown weather condition';
  }

  private getIconFromWMO(code: number): string {
    const iconMap: Record<number, string> = {
      0: '01d', 1: '02d', 2: '03d', 3: '04d',
      45: '50d', 48: '50d',
      51: '09d', 53: '09d', 55: '09d',
      61: '10d', 63: '10d', 65: '10d',
      71: '13d', 73: '13d', 75: '13d',
      95: '11d', 96: '11d', 99: '11d'
    };
    return iconMap[code] || '01d';
  }

  // Utility functions for Meteostat
  private getWeatherFromMeteostat(data: any): string {
    // Meteostat doesn't provide weather conditions directly
    // We'll infer from temperature and precipitation data
    if (data.prcp && data.prcp > 0) {
      if (data.tavg && data.tavg < 0) {
        return 'Snow';
      }
      return 'Rain';
    }

    if (data.tavg) {
      if (data.tavg > 25) return 'Hot';
      if (data.tavg < 0) return 'Cold';
    }

    return 'Clear';
  }

  private getWeatherDescriptionFromMeteostat(data: any): string {
    if (data.prcp && data.prcp > 0) {
      if (data.prcp > 10) {
        return data.tavg && data.tavg < 0 ? 'Heavy snow' : 'Heavy rain';
      } else if (data.prcp > 2) {
        return data.tavg && data.tavg < 0 ? 'Moderate snow' : 'Moderate rain';
      } else {
        return data.tavg && data.tavg < 0 ? 'Light snow' : 'Light rain';
      }
    }

    if (data.tavg) {
      if (data.tavg > 30) return 'Very hot weather';
      if (data.tavg > 25) return 'Hot weather';
      if (data.tavg < -10) return 'Very cold weather';
      if (data.tavg < 0) return 'Cold weather';
    }

    return 'Clear weather conditions';
  }

  private getIconFromMeteostat(data: any): string {
    if (data.prcp && data.prcp > 0) {
      if (data.tavg && data.tavg < 0) {
        return '13d'; // Snow
      }
      return '10d'; // Rain
    }

    return '01d'; // Clear/sunny
  }

  // Check if location is in US (for NWS API)
  private isUSLocation(latitude: number, longitude: number): boolean {
    // Rough bounds for US (including Alaska and Hawaii)
    return (
      (latitude >= 24.396308 && latitude <= 49.384358 && longitude >= -125.0 && longitude <= -66.93457) || // Continental US
      (latitude >= 18.91619 && latitude <= 28.402123 && longitude >= -178.334698 && longitude <= -154.806773) || // Hawaii
      (latitude >= 51.209 && latitude <= 71.406 && longitude >= -179.148909 && longitude <= -129.979506) // Alaska
    );
  }

  // Health check method
  async healthCheck(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [key, api] of Object.entries(this.apis)) {
      const startTime = Date.now();
      try {
        let testUrl = '';
        const headers: Record<string, string> = {};
        
        if (key === 'openweather' && api.apiKey) {
          testUrl = `${api.baseUrl}/weather?lat=33.2098&lon=-87.5692&appid=${api.apiKey}&units=imperial`;
        } else if (key === 'weatherapi' && api.apiKey) {
          testUrl = `${api.baseUrl}/current.json?key=${api.apiKey}&q=33.2098,-87.5692&aqi=no`;
        } else if (key === 'nws') {
          testUrl = `${api.baseUrl}/points/33.2098,-87.5692`;
          headers['User-Agent'] = 'WeatherSafetyApp/1.0 (contact@example.com)';
        } else if (key === 'openmeteo') {
          testUrl = `${api.baseUrl}/forecast?latitude=33.2098&longitude=-87.5692&current_weather=true`;
        } else if (key === 'meteostat' && api.apiKey) {
          testUrl = `${api.baseUrl}/stations/nearby?lat=33.2098&lon=-87.5692`;
          headers['X-RapidAPI-Key'] = api.apiKey;
          headers['X-RapidAPI-Host'] = 'meteostat.p.rapidapi.com';
        }

        if (testUrl) {
          await axios.get(testUrl, { timeout: 3000, headers });
          health[key] = {
            status: 'healthy',
            responseTime: Date.now() - startTime,
            rateLimit: api.rateLimit
          };
        } else {
          health[key] = {
            status: 'disabled',
            reason: 'No API key configured'
          };
        }
      } catch (error) {
        health[key] = {
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          rateLimit: api.rateLimit
        };
      }
    }

    return {
      timestamp: new Date().toISOString(),
      cacheSize: this.cache.size,
      apis: health
    };
  }

  // Public method to get monthly point data from Meteostat
  async getMonthlyPointData(latitude: number, longitude: number, year: number, month: number): Promise<any> {
    if (!this.checkRateLimit('meteostat') || !this.apis.meteostat.apiKey) {
      throw new Error('Meteostat API not available or rate limit exceeded');
    }

    try {
      const result = await this.fetchMeteostatMonthlyData(latitude, longitude, year, month);
      return {
        success: true,
        station: result.station,
        data: result.data,
        location: {
          latitude,
          longitude
        },
        period: {
          year,
          month
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch monthly data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Log weather API failures for monitoring
  private async logWeatherApiFailure(
    latitude: number,
    longitude: number,
    errors: string[],
    lastError: Error | null
  ): Promise<void> {
    try {
      const errorData = {
        type: 'weather_api_failure',
        location: { latitude, longitude },
        errors,
        lastError: lastError?.message,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        online: typeof navigator !== 'undefined' ? navigator.onLine : false,
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      };

      // Send to monitoring endpoint (in a real app)
      console.error('Weather API Failure:', errorData);
    } catch (error) {
      console.error('Failed to log weather API failure:', error);
    }
  }
}

export const weatherService = new WeatherService();
