# Code Snippet RAG - Frontend

A modern React frontend for the Code Snippet RAG system. Search code snippets using natural language, with advanced filtering and AI-powered answers.

## 🚀 Features

- **Natural Language Search**: Ask questions in plain English
- **Smart Filtering**: Filter by programming language and tags
- **Real-time Results**: Instant search with loading states
- **Code Highlighting**: Syntax-highlighted code snippets with copy button
- **Add Snippets**: Contribute your own code snippets to the knowledge base
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Easy on the eyes with professional dark UI

---

## 📋 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **React Router** | 6.20.0 | Client-side routing |
| **Vite** | 5.0.8 | Build tool & dev server |
| **Context API** | Built-in | Global state management |
| **Vanilla CSS** | CSS3 | Styling (no preprocessors) |

---

## 🗂️ Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Navbar.jsx            # Navigation bar
│   │   ├── Navbar.css
│   │   ├── SearchBar.jsx         # Search input component
│   │   ├── SearchBar.css
│   │   ├── SearchResults.jsx     # Display search results
│   │   ├── SearchResults.css
│   │   ├── CodeBlock.jsx         # Code display with copy
│   │   ├── CodeBlock.css
│   │   ├── FilterPanel.jsx       # Language/tag filters
│   │   └── FilterPanel.css
│   ├── pages/
│   │   ├── Home.jsx              # Landing page
│   │   ├── Home.css
│   │   ├── Search.jsx            # Search page
│   │   ├── Search.css
│   │   ├── AddSnippet.jsx        # Add snippet form
│   │   ├── AddSnippet.css
│   │   ├── NotFound.jsx          # 404 page
│   │   └── NotFound.css
│   ├── context/
│   │   └── RAGContext.jsx        # Global state provider
│   ├── services/
│   │   └── api.js                # API service layer
│   ├── App.jsx                   # Main app component
│   ├── App.css
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔧 Installation

### Prerequisites

- Node.js v18+
- npm or yarn
- Backend server running on `http://localhost:3000`

### Setup Steps

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:5173
```

---

## 🚀 Available Scripts

### Development
```bash
npm run dev
```
Starts Vite dev server with HMR (Hot Module Replacement) on port 5173.

### Build
```bash
npm run build
```
Creates optimized production build in `dist/` folder.

### Preview
```bash
npm run preview
```
Preview production build locally.

---

## 🌐 API Integration

The frontend connects to the backend via proxy configured in `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

All API calls to `/api/*` are automatically proxied to the backend server.

---

## 📡 API Service

Centralized in `src/services/api.js`:

```javascript
// Search
await api.search(query, { language, tags });

// Add snippet
await api.addSnippet({ code, description, language, tags });

// Health check
await api.healthCheck();

// Ingest documents (admin)
await api.ingest();
```

---

## 🎨 Styling

### CSS Architecture

- **Global styles**: `index.css` (CSS variables, reset, animations)
- **Component styles**: Each component has its own CSS file
- **No CSS-in-JS**: Pure vanilla CSS for simplicity
- **CSS Variables**: Consistent theming via `:root` variables

### Color Scheme

```css
--primary: #6366f1;      /* Indigo */
--secondary: #8b5cf6;    /* Purple */
--background: #0f172a;   /* Dark blue */
--surface: #1e293b;      /* Card background */
--text-primary: #f1f5f9; /* Light text */
--text-secondary: #94a3b8; /* Muted text */
```

### Responsive Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## 🧩 Components

### Navbar
Navigation bar with active link highlighting.

**Props:** None (uses React Router location)

**Features:**
- Logo with icon
- Active route highlighting
- Responsive mobile menu

---

### SearchBar
Search input with submit button and loading state.

**Props:** None (uses RAG context)

**Features:**
- Controlled input
- Loading spinner
- Disabled state when searching
- Enter key submit

---

### SearchResults
Displays AI-generated answer and retrieved code chunks.

**Props:** None (uses RAG context)

**Features:**
- Loading state with spinner
- Error handling with retry
- Answer section
- Chunk cards with metadata
- RRF scores display

---

### CodeBlock
Syntax-highlighted code display with copy button.

**Props:**
- `code`: string - Code content
- `language`: string - Programming language

**Features:**
- Copy to clipboard
- Success feedback
- Language badge
- Scrollable overflow

---

### FilterPanel
Language and tag filters with clear all button.

**Props:** None (uses RAG context)

**Features:**
- Language dropdown
- Tag toggle buttons
- Clear all filters
- Active state styling

---

## 🌍 Pages

### Home (`/`)
Landing page with hero section, features grid, and example queries.

**Features:**
- Call-to-action buttons
- Feature cards with icons
- Example query cards (clickable → navigate to search)

---

### Search (`/search`)
Main search interface with filters and results.

**Layout:**
- Search bar at top
- Filter panel (sidebar on desktop, top on mobile)
- Results area

---

### AddSnippet (`/add-snippet`)
Form to submit new code snippets.

**Features:**
- Required field validation
- Language dropdown
- Tag input (comma-separated)
- Live code preview
- Success/error alerts

---

### NotFound (`*`)
404 error page with back-to-home button.

---

## 🔄 State Management

### RAGContext

Global state provider using React Context API.

**State:**
```javascript
{
  searchResults: null,      // Last search results
  searchLoading: false,     // Loading state
  searchError: null,        // Error message
  filters: {                // Active filters
    language: null,
    tags: []
  },
  searchHistory: []         // Recent searches
}
```

**Actions:**
```javascript
performSearch(query)        // Execute search
addSnippet(snippetData)     // Add new snippet
clearSearch()               // Clear results
updateFilters(newFilters)   // Update filters
clearFilters()              // Reset all filters
```

---

## 🎯 Usage Examples

### Performing a Search

```jsx
import { useRAG } from '../context/RAGContext';

function MyComponent() {
  const { performSearch, searchResults, searchLoading } = useRAG();

  const handleSearch = () => {
    performSearch("reverse string python");
  };

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
      {searchLoading && <p>Loading...</p>}
      {searchResults && <p>{searchResults.answer}</p>}
    </div>
  );
}
```

### Adding Filters

```jsx
import { useRAG } from '../context/RAGContext';

function MyComponent() {
  const { updateFilters, filters } = useRAG();

  const handleLanguageChange = (e) => {
    updateFilters({ language: e.target.value });
  };

  return (
    <select value={filters.language || ''} onChange={handleLanguageChange}>
      <option value="">All Languages</option>
      <option value="python">Python</option>
      <option value="javascript">JavaScript</option>
    </select>
  );
}
```

---

## 🐛 Troubleshooting

### Port 5173 already in use
**Solution:**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3001
```

### API calls fail with CORS error
**Solution:** Ensure backend has CORS enabled:
```javascript
// backend/src/index.js
import cors from 'cors';
app.use(cors());
```

### Build fails
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Styles not loading
**Solution:** Ensure CSS imports in components:
```jsx
import './MyComponent.css';
```

---

## 📱 Responsive Design

The app is fully responsive with breakpoints at:

**Mobile (< 768px):**
- Single column layout
- Stacked filters
- Smaller fonts
- Full-width buttons

**Tablet (768px - 1024px):**
- Two-column grid for features
- Sidebar filters move to top

**Desktop (> 1024px):**
- Sidebar filters (sticky)
- Three-column feature grid
- Larger hero text

---

## ⚡ Performance

### Optimizations
- Vite for fast HMR and builds
- Code splitting via React Router
- Lazy loading (future enhancement)
- Debounced search (future enhancement)

### Metrics
- **First Load:** ~200ms
- **Search Response:** < 1s (depends on backend)
- **Build Size:** ~150KB (gzipped)

---

## 🚧 Future Enhancements

- [ ] Search history with persistence
- [ ] Favorite snippets
- [ ] Syntax highlighting with Prism.js
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [ ] Export search results
- [ ] Share search links
- [ ] Infinite scroll for results
- [ ] Advanced search operators

---

## 🎨 Customization

### Changing Colors

Edit `src/index.css`:

```css
:root {
  --primary: #your-color;
  --secondary: #your-color;
  --background: #your-color;
}
```

### Adding New Languages to Filter

Edit `src/components/FilterPanel.jsx`:

```javascript
const languages = ['python', 'javascript', 'rust', 'go', 'your-language'];
```

### Adding New Tags

Edit `src/components/FilterPanel.jsx`:

```javascript
const commonTags = ['array', 'string', 'your-tag'];
```

---

## 📦 Build & Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` folder

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables (Production)

For production deployment, set backend URL:

```bash
# .env.production
VITE_API_URL=https://your-backend-url.com
```

Update `api.js`:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
```

---

## 📝 License

MIT

---

## 👤 Author

Built as part of RAG learning project series.

---

## 🙏 Acknowledgments

- React team for amazing framework
- Vite for blazing fast tooling
- React Router for seamless navigation

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check backend README for API docs
- Review component JSX for usage examples
- 
