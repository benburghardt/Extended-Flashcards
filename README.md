# Extended-Flashcards
This application allows the user to create complex flashcards that are more than just front and back.

## Instructions

### Prerequisites
Before running this application, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Rust** (latest stable) - [Install via rustup](https://rustup.rs/)
- **Tauri CLI** - Install with: `cargo install tauri-cli`

### Initial Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Extended-Flashcards
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Verify Tauri installation**:
   ```bash
   cargo tauri --version
   ```

### Running the Application

#### Development Mode
To run the application in development mode with hot reloading:

```bash
npm run tauri:dev
```

This command will:
- Start the Vite development server for the frontend
- Compile the Rust backend
- Launch the native desktop application
- Enable hot reloading for both frontend and backend changes

**Note**: The first run may take several minutes as Rust dependencies are downloaded and compiled.

#### Frontend Only (for UI development)
To run just the frontend in a web browser:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Building for Production

#### Frontend Build
To build the frontend for production:

```bash
npm run build
```

#### Full Application Build
To build the complete desktop application:

```bash
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/`

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production frontend build |
| `npm run tauri:dev` | Start full Tauri app in development mode |
| `npm run tauri:build` | Build production Tauri application |

### Project Structure

```
Extended-Flashcards/
├── src/                    # React frontend source
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # React entry point
│   └── *.css              # Styling files
├── src-tauri/             # Rust backend source
│   ├── src/               # Rust source code
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── dist/                  # Built frontend (generated)
├── package.json           # Frontend dependencies and scripts
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
└── EditHistory.md         # Detailed change log and troubleshooting
```

### Troubleshooting

If you encounter issues:

1. **Check EditHistory.md** - Contains detailed error solutions from development
2. **Verify Prerequisites** - Ensure Node.js, Rust, and Tauri CLI are properly installed
3. **Clear Build Cache** - Delete `node_modules`, `dist`, and `src-tauri/target` directories, then reinstall
4. **Check Ports** - Ensure port 5173 is available for the development server

### Development Workflow

1. Make changes to frontend code in `src/`
2. Make changes to backend code in `src-tauri/src/`
3. Run `npm run tauri:dev` to test changes
4. Build with `npm run tauri:build` when ready for production
