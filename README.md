# Fitcha - Athletic Social Platform

Fitcha is a comprehensive social-sports platform that connects athletes, facilitates court bookings, and builds athletic communities. Think of it as "LinkedIn for athletes."

## 🏆 Features

### Core Functionality
- **Social Feed**: Share athletic achievements and connect with other athletes
- **Player Discovery**: Find training partners and teammates based on sport, skill level, and location
- **Court Booking**: Search, view, and book sports facilities
- **Game Requests**: Send and manage requests to play with other athletes
- **Real-time Messaging**: Direct messaging between athletes
- **Profile Management**: Comprehensive athletic profiles with sports, skills, and achievements

### Advanced Features
- **Game Sessions**: Collaborative booking and payment splitting
- **Friend System**: Connect with other athletes
- **Notifications**: Real-time updates for requests, messages, and bookings
- **Reviews & Ratings**: Rate playing partners and build trust scores
- **Achievement Tracking**: Showcase certifications, awards, and athletic accomplishments

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library
- **Type Safety**: Full TypeScript coverage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fitcha.git
   cd fitcha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Import the SQL migrations from `supabase/migrations/`
   - Ensure Row Level Security (RLS) is enabled on all tables

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

### Test Coverage
- **94 test cases** covering core functionality
- Unit tests for hooks and services
- Component integration tests
- User flow testing
- Form validation testing

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components (Header, etc.)
│   ├── profile/        # Profile-related components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── __tests__/          # Test files
└── lib/                # Third-party library configurations
```

## 🔒 Security

- **Row Level Security**: All database operations are secured with Supabase RLS
- **Input Validation**: Comprehensive client and server-side validation
- **Authentication**: Secure email/password authentication via Supabase Auth
- **Data Privacy**: User data is properly scoped and protected

## 🎯 Key Components

### Authentication Flow
- Secure login/signup with email verification
- Protected routes and authentication state management
- Profile creation and management

### Social Features
- Real-time social feed with posts and interactions
- Friend requests and connections
- Direct messaging system

### Booking System
- Court search with advanced filtering
- Real-time availability checking
- Secure booking and payment processing

### Game Management
- Game request system
- Session management with chat
- Court selection and payment splitting

## 🔧 Development

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Full type safety
- **Testing**: Comprehensive test coverage
- **Git Hooks**: Pre-commit quality checks

### Performance
- **Code Splitting**: Route-based lazy loading
- **Optimized Builds**: Vite for fast development and optimized production builds
- **Image Optimization**: Lazy loading and responsive images

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following key tables:

- `profiles` - User profile information
- `user_sports` - User sport skills and preferences
- `achievements` - Athletic achievements and certifications
- `game_requests` - Requests to play with other users
- `game_sessions` - Collaborative game sessions
- `courts` - Sports facility information
- `bookings` - Court booking records
- `messages` - Direct messaging
- `friendships` - User connections
- `posts` - Social feed content

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **React Testing Library** for testing utilities
- **Lucide** for the beautiful icon set

## 📞 Support

For support, email support@fitcha.app or join our Discord community.

---

**Built with ❤️ for the athletic community**