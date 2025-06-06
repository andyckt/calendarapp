# Calendar Application

A modern calendar application with user authentication, event management, and beautiful UI.

## Features

- User authentication (register, login, logout)
- Calendar management (create, view, update, delete)
- Event management (create, view, update, delete)
- Multiple calendar views (day, week, month)
- Responsive design with a beautiful UI
- MongoDB Atlas database for production
- JWT authentication

## Production Setup Guide

### Setting up MongoDB Atlas

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (you can use the free tier)
3. Set up database access:
   - Create a database user with appropriate permissions
   - Set a strong password
4. Set up network access:
   - Add your current IP address or allow access from anywhere (for development)
   - For production, restrict to your deployment server's IP
5. Once your cluster is created, click "Connect" and select "Connect your application"
6. Copy the connection string and replace the placeholders with your username and password

### Environment Variables

Create or update the `.env` file with the following variables:

```
DATABASE_URL="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/calendardb?retryWrites=true&w=majority"
JWT_SECRET="your-super-secure-secret-key-for-production"
NODE_ENV="production"
```

Replace:
- `YOUR_USERNAME` and `YOUR_PASSWORD` with your MongoDB Atlas credentials
- `YOUR_CLUSTER` with your MongoDB Atlas cluster name
- `JWT_SECRET` with a strong, random string for JWT token generation

### Deployment Steps

1. **Generate Prisma Client**:
   ```
   npx prisma generate
   ```

2. **Build the application**:
   ```
   npm run build
   ```

3. **Start the application**:
   ```
   npm start
   ```

For production deployment, you can use platforms like Vercel, Netlify, or deploy to your own server.

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/calendarapp.git
   cd calendarapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (create a `.env` file in the root directory)

4. Generate Prisma client:
   ```
   npx prisma generate
   ```

5. Run the development server:
   ```
   npm run dev
   ```

## Database Schema

The application uses MongoDB with the following schema:

- **User**: Stores user accounts
- **Calendar**: Stores calendars owned by users
- **Event**: Stores calendar events
- **EventAttendee**: Manages the many-to-many relationship between events and users

## Tech Stack

- Next.js for frontend and API routes
- React for UI components
- Prisma ORM for database access
- MongoDB Atlas for database
- JWT for authentication
- TypeScript for type safety
- TailwindCSS for styling 