# SmartNote App 📝

A modern, intelligent note-taking application built with Angular 17 and Firebase. SmartNote provides a clean, minimalist interface for creating, editing, and managing your notes with real-time synchronization across devices.

## ✨ Features

- **🔒 Anonymous Authentication** - Start taking notes instantly without signup
- **☁️ Cloud Sync** - Real-time synchronization with Firebase Firestore
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🔄 Offline Support** - Continue working even when offline with IndexedDB persistence
- **⚡ Version Control** - Track changes and handle conflicts automatically
- **🎨 Modern UI** - Clean, minimalist design with Tailwind CSS
- **🚀 Fast & Lightweight** - Optimized bundle size and performance

## 🛠️ Tech Stack

- **Frontend**: Angular 17 (Standalone Components)
- **Backend**: Firebase (Firestore, Authentication)
- **Styling**: Tailwind CSS
- **State Management**: NgRx Signals
- **Build Tool**: Angular CLI

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-note-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Update `src/environments/environment.ts` with your Firebase configuration:
   ```typescript
   export const environment = {
     production: false,
     firebase: {
       apiKey: "your-api-key-here",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef123456"
     }
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200/` in your browser.

## 📖 Usage

### Creating Notes
1. Click "Get Started" on the login page to authenticate anonymously
2. Click "Create New Note" on the notes dashboard
3. Add a title and content for your note
4. Save automatically as you type

### Managing Notes
- **Edit**: Click the "Edit" button on any note card
- **Delete**: Click the "Delete" button to remove a note
- **Search**: Use the search functionality to find specific notes
- **Sync**: Notes automatically sync across all your devices

### Offline Mode
- SmartNote works offline using IndexedDB persistence
- Changes sync automatically when you're back online
- Conflict resolution handles simultaneous edits gracefully

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── login/              # Authentication component
│   │   ├── note-list/          # Notes dashboard
│   │   ├── note-edit/          # Note editor
│   │   └── conflict-resolver/  # Handles sync conflicts
│   ├── services/
│   │   ├── auth.service.ts     # Authentication logic
│   │   ├── note.service.ts     # Note CRUD operations
│   │   └── auth.guard.ts       # Route protection
│   ├── stores/
│   │   └── notes.store.ts      # State management
│   ├── models/
│   │   └── note.model.ts       # TypeScript interfaces
│   └── environments/
│       └── environment.ts      # Configuration
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests
- `npm run lint` - Lint the codebase

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

## 🔐 Security Features

- Anonymous authentication through Firebase Auth
- Secure data storage with Firestore security rules
- Client-side data validation
- HTTPS-only in production

## 🧪 Simulating Offline & Conflict Scenarios

To test offline functionality and conflict resolution:

1. **Offline Mode**:
   - Start the app and create/edit notes.
   - Disable your internet connection (e.g., via browser DevTools or system settings).
   - Make changes to notes; they will persist locally via IndexedDB.
   - Reconnect to the internet; changes will sync automatically with Firestore.

2. **Conflict Scenarios**:
   - Open the app on two devices/browsers with the same user.
   - Edit the same note on both instances simultaneously.
   - Save changes on one device, then sync the other; the conflict-resolver component will prompt to merge or choose a version based on the `version` field.
