# PDF World

A PDF to PDF/A converter with drag-and-drop page rearrangement built with Electron, React, and TypeScript.

## Features

- Convert PDF files to PDF/A format
- Merge multiple PDF files
- Drag-and-drop page rearrangement
- Automatic Ghostscript installation (Windows)
- Modern React-based UI with TypeScript
- Beautiful UI with shadcn/ui components and Tailwind CSS

## Development

This project has been restructured to use:

- **Electron** for the desktop application framework
- **React** for the user interface
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful, accessible components
- **Secure IPC** communication between main and renderer processes

## Project Structure

```
PDF-world/
├── src/
│   ├── electron/          # Electron main process
│   │   ├── main.ts       # Main process entry point
│   │   └── preload.ts    # Preload script for secure IPC
│   └── ui/               # React frontend
│       ├── components/   # React components
│       │   ├── ui/       # shadcn/ui components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── input.tsx
│       │   │   └── badge.tsx
│       │   └── ...       # Custom components
│       ├── lib/          # Utility functions
│       │   └── utils.ts  # shadcn/ui utilities
│       ├── hooks/        # Custom React hooks
│       ├── App.tsx       # Main React component
│       ├── main.tsx      # React entry point
│       └── index.css     # Tailwind CSS styles
├── dist/                 # Built application
├── dist-electron/        # Built Electron files
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── vite.config.ts       # Vite configuration
└── README.md           # This file
```

## UI Components

This project uses shadcn/ui components for a consistent and beautiful interface:

- **Button** - Various button styles and variants
- **Card** - Container components with headers and content
- **Badge** - Status indicators and labels
- **Input** - Form input components

All components are built with accessibility in mind and follow modern design patterns.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build:linux` - Build for Linux
- `npm run build:win` - Build for Windows
- `npm run build:mac` - Build for macOS
- `npm test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Building Distributables

### Linux

```bash
npm run build:linux
```

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

## Architecture

### Main Process (Electron)

- Handles file system operations
- Manages Ghostscript installation
- Provides secure IPC endpoints
- Handles native dialogs

### Renderer Process (React)

- Modern React UI with TypeScript
- Secure communication via preload script
- Drag-and-drop functionality
- Real-time status updates

### Security

- Context isolation enabled
- Node integration disabled
- Secure IPC communication
- Type-safe API contracts

## Dependencies

### Production

- `electron` - Desktop application framework
- `react` - UI library
- `react-dom` - React DOM rendering
- `pdf-lib` - PDF manipulation
- `pdf-merger-js` - PDF merging

### Development

- `typescript` - Type safety
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `vite-plugin-electron` - Electron integration
- `electron-builder` - Application packaging
- `vitest` - Testing framework
- `@playwright/test` - E2E testing

## License

ISC
