# WeatherGuard 🌩️

A comprehensive emergency preparedness and family safety application that combines real-time weather monitoring, location tracking, and emergency communication tools. Stay safe, stay connected, and stay prepared.

## 🚀 Live Demo

Experience WeatherGuard in action:
- **🌐 Live Demo**: [https://weatherguard-demo.vercel.app](http://localhost:3000)
- **🎬 Interactive Demo**: Watch our embedded demonstration
- **🌍 Global Coverage**: Test with locations like "Tokyo", "London", "Sydney", "Eiffel Tower"
- **🚨 Emergency Features**: Activate emergency mode and safety check-ins
- **📱 Mobile Optimized**: Perfect for on-the-go emergency use

## ✨ Key Features

### 🗺️ Interactive Weather Map
- **Real-time Weather Radar**: Live weather data with multiple API sources
- **Location Markers**: View saved locations and live positions
- **Alert Zones**: Visual weather warnings and disaster event areas
- **Global Coverage**: Works anywhere in the world

### 📍 Smart Location Management
- **Save Important Places**: Home, work, school, and family locations
- **Live Location Sharing**: Plan real-time location sharing with contacts
- **Privacy Controls**: Granular permissions for each contact
- **Emergency Override**: Automatic location sharing during alerts

### 👥 Emergency Contact Network
- **Contact Management**: Organize family and emergency contacts
- **Relationship Categories**: Family, friends, emergency services
- **Permission Settings**: Control who can see your location and when
- **Quick Communication**: Direct contact during emergencies

### 🆘 Safety Check-ins
- **One-Tap Updates**: Quick "I'm Safe" status broadcasts
- **Emergency Alerts**: Send help requests with location
- **Message Customization**: Add context to your status
- **Auto-Notifications**: Contacts receive instant updates

### ⚠️ Real-time Alerts
- **Weather Warnings**: Severe weather and storm alerts
- **Disaster Monitoring**: Earthquakes, floods, and other emergencies  
- **Browser Notifications**: Alerts even when app is closed
- **Severity Filtering**: Focus on critical alerts only

### 🔒 Privacy & Security
- **Data Control**: You own your location data
- **Temporary Sharing**: Set time limits on location access
- **Precision Settings**: Share exact or approximate location
- **Offline Mode**: Critical features work without internet

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with geolocation support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sunayana225/WeatherGuard.git
   cd WeatherGuard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys for enhanced features
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   - Navigate to http://localhost:3000
   - Click "Try Live Demo" to access the dashboard
   - For enhanced weather data, add API keys to `.env.local`

### Running with Full Backend

For complete functionality with real-time data:

```bash
# Start both frontend and backend
npm run dev:full

# Or run separately
npm run dev        # Frontend only
npm run server:dev # Backend only
```

## 📱 How It Works

### Getting Started
1. **🏠 Homepage**: Visit WeatherGuard and explore the features overview
2. **🚀 Launch Demo**: Click "Try Live Demo" to access the dashboard
3. **🗺️ Explore Map**: Use the interactive map to view weather and location data
4. **📍 Add Locations**: Save important places like home, work, and family locations
5. **👥 Setup Contacts**: Add emergency contacts and configure sharing permissions
6. **🆘 Test Safety Features**: Try the safety check-in system

### Using the Interactive Map
- **🌦️ Weather Layers**: Toggle weather radar and traffic overlays
- **📍 Location Markers**: View saved locations and live positions
- **⚠️ Alert Zones**: See weather warnings and disaster areas
- **🔍 Search**: Find any location worldwide using the search bar

### Managing Locations
- **📌 Static Locations**: Save and categorize important places
- **📱 Live Sharing**: Plan real-time location sharing with contacts
- **🔒 Privacy Controls**: Set permissions for each contact individually
- **🚨 Emergency Mode**: Automatic location sharing during alerts

### Safety & Emergency Features
- **✅ Quick Check-ins**: One-tap "I'm Safe" updates to all contacts
- **🆘 Emergency Alerts**: Send help requests with your current location
- **💬 Custom Messages**: Add details to your status updates
- **🔔 Real-time Notifications**: Instant alerts for weather and emergencies

## 🏗️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Modern React with latest features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Responsive styling
- **React Leaflet**: Interactive maps
- **Lucide React**: Beautiful icons

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **SQLite**: Local database
- **TypeScript**: Type-safe backend code

### APIs & Services
- **OpenWeatherMap**: Primary weather data
- **WeatherAPI**: Backup weather source
- **National Weather Service**: US weather alerts
- **USGS**: Earthquake data
- **Browser Geolocation**: Location services

### Key Libraries
- **React Joyride**: Interactive tours
- **Recharts**: Data visualization
- **Firebase**: Authentication ready
- **Jest**: Testing framework
- **ESLint**: Code quality

## ⚙️ Configuration

### API Keys (Optional)

WeatherGuard works out of the box, but for enhanced features you can add API keys:

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys to `.env.local`:**
   ```bash
   # Weather APIs (for enhanced weather data)
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
   NEXT_PUBLIC_WEATHERAPI_KEY=your_weatherapi_key
   
   # Firebase (for authentication features)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```

### Getting API Keys

1. **OpenWeatherMap** (Free tier: 1,000 calls/day)
   - Sign up at [openweathermap.org](https://openweathermap.org/api)
   - Get instant API access

2. **WeatherAPI** (Free tier: 1M calls/month)
   - Sign up at [weatherapi.com](https://www.weatherapi.com/)
   - Generous free tier

3. **Firebase** (Optional, for user accounts)
   - Create project at [firebase.google.com](https://firebase.google.com/)
   - Enable Authentication

> **Note**: WeatherGuard includes fallback weather data, so API keys are optional for basic functionality.

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:full         # Start frontend + backend
npm run server:dev       # Start backend only

# Production
npm run build            # Build for production
npm start               # Start production server

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
```

### Project Structure

```
WeatherGuard/
├── src/
│   ├── app/                 # Next.js pages and API routes
│   ├── components/          # React components
│   │   ├── Map/            # Map and location components
│   │   ├── Safety/         # Emergency and safety features
│   │   ├── UI/             # Reusable UI components
│   │   └── Weather/        # Weather-related components
│   ├── lib/                # Utilities and services
│   └── types/              # TypeScript definitions
├── server/                 # Express.js backend
└── __tests__/             # Test files
```

### Testing Checklist

- [ ] Map loads and displays correctly
- [ ] Location search works globally
- [ ] Weather data displays properly
- [ ] Safety check-ins submit successfully
- [ ] Mobile responsiveness
- [ ] Offline functionality
- [ ] Emergency alert system

## 📚 API Reference

### Weather Endpoints
```
GET /api/weather/current?lat={lat}&lng={lng}
GET /api/weather/alerts/active
GET /api/weather/meteostat/monthly?lat={lat}&lng={lng}&year={year}&month={month}
```

### Location Endpoints
```
GET /api/locations/static/user/{userId}
POST /api/locations/static
PUT /api/locations/static/{id}
DELETE /api/locations/static/{id}
```

### Safety Endpoints
```
GET /api/safety/checkins/user/{userId}
POST /api/safety/checkins
GET /api/safety/notifications/user/{userId}
```

### Contact Endpoints
```
GET /api/contacts/user/{userId}
POST /api/contacts
PUT /api/contacts/{id}
DELETE /api/contacts/{id}
```

## 🚀 Deployment

### Quick Deploy

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
2. **Connect repository to Vercel**
3. **Set environment variables in Vercel dashboard**
4. **Deploy automatically**

### Deploy to Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `out` (after configuring static export)
3. **Set environment variables**

### Environment Variables for Production

```bash
NODE_ENV=production
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key
NEXT_PUBLIC_WEATHERAPI_KEY=your_key
# Add other API keys as needed
```

## 🤝 Contributing

We welcome contributions! Here's how you can help make WeatherGuard better:

### Development Setup
1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/WeatherGuard.git
   cd WeatherGuard
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
5. **Start developing**
   ```bash
   npm run dev
   ```

### Contribution Guidelines
- **Write Tests**: Add tests for new features
- **Follow Code Style**: Use ESLint and Prettier
- **Update Documentation**: Keep README and comments current
- **Small PRs**: Make focused, reviewable changes
- **Descriptive Commits**: Use conventional commit messages

### Commit Message Format
```
feat: add location sharing feature
fix: resolve map loading issue
docs: update API documentation
test: add safety feature tests
```

### Pull Request Process
1. **Test Your Changes**: Ensure all tests pass
2. **Update Documentation**: If needed
3. **Create Pull Request**: With clear description
4. **Code Review**: Address feedback
5. **Merge**: After approval

## 📞 Support & Help

### Common Issues

**🗺️ Map not loading**
- Check browser console for errors
- Ensure geolocation permission is granted
- Verify internet connection

**🌦️ Weather data not updating**
- Check API key configuration in `.env.local`
- Verify API rate limits haven't been exceeded
- Check browser network tab for failed requests

**📍 Location sharing not working**
- Ensure HTTPS connection (required for geolocation)
- Check browser geolocation permissions
- Try refreshing the page

### Getting Help
- **📖 Documentation**: Check this README
- **🐛 Issues**: [GitHub Issues](https://github.com/Sunayana225/WeatherGuard/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Sunayana225/WeatherGuard/discussions)
- **📧 Email**: yakkalasunayana1605@gmail.com

## 🔮 Roadmap

### Upcoming Features
- **📱 Mobile App**: React Native implementation
- **🔔 Push Notifications**: Real-time emergency alerts
- **🗺️ Geofencing**: Location-based automatic alerts
- **📊 Analytics**: Personal safety insights
- **🌐 Offline Maps**: Enhanced offline functionality
- **🏥 Emergency Services**: Direct integration with local services

### Technical Improvements
- **⚡ Performance**: Faster map loading and data processing
- **♿ Accessibility**: Enhanced screen reader support
- **🔒 Security**: End-to-end encryption for sensitive data
- **📈 Scalability**: Cloud database and real-time sync
- **🌍 Internationalization**: Multi-language support

## 👥 Team

**Developed by Team NPC:**
- **Sunayana Yakkala** - Lead Developer & Project Architect
- **Aditya** - Frontend Developer & User Experience  
- **Rohiith** - UI/UX Developer & Design Systems

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Weather Data**: OpenWeatherMap, WeatherAPI, National Weather Service
- **Mapping**: Leaflet and OpenStreetMap contributors
- **Icons**: Lucide React icon library
- **Community**: All contributors and testers

---

**⚡ Don't wait for the next emergency - Be prepared with WeatherGuard!**

Built with ❤️ for emergency preparedness and family safety.
