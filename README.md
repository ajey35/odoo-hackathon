# SynergySphere - Team Collaboration Platform

A modern, full-stack team collaboration platform built with Next.js, TypeScript, Prisma, and PostgreSQL. Manage projects, tasks, and team members with a beautiful, responsive interface.

## Features

###  Core Functionality
- **Project Management** - Create, organize, and track team projects
- **Task Management** - Kanban-style task boards with drag-and-drop functionality
- **Team Collaboration** - Invite members, assign roles, and manage permissions
- **Real-time Notifications** - Stay updated with project and task activities
- **User Authentication** - Secure JWT-based authentication system
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

###  UI/UX Features
- **Modern Design** - Clean, intuitive interface with dark/light theme support
- **Responsive Layout** - Fully responsive design that adapts to any screen size
- **Interactive Components** - Smooth animations and hover effects
- **Accessibility** - Built with accessibility best practices
- **Custom Styling** - Tailwind CSS with custom components

## 🏗 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible component library
- **Lucide React** - Icon library
- **Date-fns** - Date manipulation utilities

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - Modern ORM for database management
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Zod** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Prisma Studio** - Database management UI

##  Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synergysphere
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd synergysphere
   npm install

   # Backend
   cd ../backend-do
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb synergysphere

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   ```bash
   cd backend-do
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend-do
   npm run dev

   # Terminal 2 - Frontend
   cd synergysphere
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Prisma Studio: http://localhost:5555

##  Project Structure

```
synergysphere/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── auth/             # Authentication pages
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   ├── auth-provider.tsx # Authentication context
│   ├── dashboard-layout.tsx # Main layout
│   └── ...              # Feature components
├── lib/                 # Utility functions
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
└── public/             # Static assets

backend-do/
├── src/
│   ├── auth/           # Authentication routes & logic
│   ├── projects/       # Project management
│   ├── tasks/          # Task management
│   ├── notifications/  # Notification system
│   ├── middleware/     # Express middleware
│   └── lib/           # Database & utilities
├── prisma/            # Database schema & migrations
└── tests/             # Test files
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Backend (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/synergysphere"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
NODE_ENV="development"
PORT=3000
```

### Database Schema

The application uses the following main entities:
- **Users** - User accounts with roles (ADMIN, USER)
- **Projects** - Team projects with descriptions and settings
- **Tasks** - Project tasks with status, assignees, and due dates
- **TeamMemberships** - User-project relationships with roles
- **Notifications** - System notifications for users

##  Usage Guide

### Getting Started

1. **Register/Login** - Create an account or login with existing credentials
2. **Create Project** - Start by creating your first project
3. **Invite Team Members** - Add team members to collaborate
4. **Create Tasks** - Break down work into manageable tasks
5. **Track Progress** - Use the Kanban board to track task status

### Key Features

#### Project Management
- Create and manage multiple projects
- Set project descriptions and settings
- Invite team members with different roles
- Track project progress and statistics

#### Task Management
- Create tasks with titles, descriptions, and due dates
- Assign tasks to team members
- Organize tasks in Kanban columns (To Do, In Progress, Done)
- Filter and search tasks

#### Team Collaboration
- Invite users via email
- Assign different roles (Owner, Admin, Member)
- Manage permissions and access levels
- Real-time updates and notifications

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend-do
npm test

# Frontend tests (if configured)
cd synergysphere
npm test
```

### Test Coverage
- API endpoint testing
- Authentication flow testing
- Database operations testing
- Component unit testing

##  Deployment

### Production Build
```bash
# Frontend
cd synergysphere
npm run build
npm start

# Backend
cd backend-do
npm run build
npm start
```

### Environment Setup
- Set up PostgreSQL database
- Configure environment variables
- Set up reverse proxy (nginx)
- Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

### Project Endpoints
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Task Endpoints
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

##  Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Authentication Issues**
- Check JWT_SECRET is set
- Verify token expiration
- Clear browser storage

**Build Issues**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables

### Getting Help
- Check the Issues tab for known problems
- Create a new issue with detailed description
- Include error logs and system information

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful components
- [Prisma](https://prisma.io/) for the modern ORM
- [Lucide](https://lucide.dev/) for the icon library

---

**Built with ❤️ by the SynergySphere Team**

For more information, visit our [documentation](docs/) or [contact us](mailto:support@synergysphere.com).
