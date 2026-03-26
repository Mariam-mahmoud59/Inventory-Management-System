# Inventory Management System

This repository contains the frontend and backend for the Inventory Management System.

## 📊 Backend Setup

**1. Database Tech**
- **Technology:** **PostgreSQL** (hosted via **Supabase**).

**2. Backend Framework**
- **Technology:** **FastAPI** (Python).

**3. Environment Variables**
- You will need to ensure your `backend/.env` file contains the following keys (there is no `.env.example` file):
  ```ini
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
  DATABASE_URL=your_supabase_postgres_connection_string
  ```

## 🚀 Backend Boot Sequence: Step-by-Step Guide
To run the backend locally on your Windows machine, open your terminal and run the following commands:

**Step 1: Navigate to the backend directory**
```bash
cd backend
```

**Step 2: Create a virtual environment**
```bash
python -m venv venv
```

**Step 3: Activate the virtual environment**
```bash
# In Command Prompt:
venv\Scripts\activate.bat

# OR in PowerShell:
.\venv\Scripts\Activate.ps1
```

**Step 4: Install the dependencies**
```bash
pip install -r requirements.txt
```

**Step 5: Start the local server**
```bash
uvicorn app.main:app --reload
```

Once the server is running:
- API endpoint: `http://localhost:8000/api/v1`
- Swagger UI docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

---

## React + TypeScript + Vite (Frontend Setup)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
