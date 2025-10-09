# TransLang - Real-Time Speech Translation

A modern web application that provides real-time German-to-English speech translation with minimal latency. Speak in German and see instant English translations as you talk.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)

## ✨ Features

- **Real-Time Translation**: Speak in German and see English translations appear instantly with 100-500ms latency
- **Live Updates**: Watch translations update in real-time as you speak
- **Dual Display**: View both final (confirmed) and live (updating) translations simultaneously
- **Source Text Toggle**: Optional display of original German transcription alongside English translation
- **Smart Audio Processing**: Optimized microphone settings with echo cancellation and noise suppression
- **Token-Based Parsing**: Intelligent text processing that distinguishes between partial and final translations
- **Endpoint Detection**: Automatic detection of speech boundaries for cleaner transcription segments
- **Secure API Key Management**: Server-side API key handling with temporary key generation

## 🛠️ Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5.0](https://www.typescriptlang.org/)
- **UI Library**: [React 18.3](https://react.dev/)
- **Speech Recognition**: [Soniox Speech-to-Text API](https://soniox.com/)
- **Audio Processing**: Web Audio API with MediaStream

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher
- **npm** or **yarn** package manager
- A modern web browser with microphone support (Chrome, Firefox, Safari, Edge)
- **Soniox API Key** - Sign up at [soniox.com](https://soniox.com/)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd translang-real_time_speech_to_translated_transcription_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   SONIOX_API_KEY=your_soniox_api_key_here
   ```

   > ⚠️ **Important**: Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SONIOX_API_KEY` | Your Soniox API key for speech recognition and translation | Yes |

### Audio Settings

The application uses optimized audio settings for speech recognition:
- **Sample Rate**: 16 kHz (optimal for speech)
- **Channels**: Mono (1 channel)
- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled
- **Auto Gain Control**: Enabled

### Translation Model

- **Model**: `stt-rt-preview-v2` (Soniox real-time model)
- **Translation Type**: One-way (German → English)
- **Source Language**: German (`de`)
- **Target Language**: English (`en`)

## 📖 Usage

1. **Grant Microphone Permission**: On first use, allow browser access to your microphone when prompted

2. **Start Translation**: Click the "🎤 Start Translation" button

3. **Speak in German**: Begin speaking in German - translations will appear in real-time

4. **View Translations**:
   - **Green boxes**: Final, confirmed translations
   - **Blue italic text**: Live, updating translations

5. **Toggle Source**: Click "👁️ Show German" to see the original German transcription

6. **Stop Recording**: Click "⏹️ Stop" to end the session gracefully, or "❌ Cancel" to abort immediately

7. **Clear Transcript**: Use "🗑️ Clear" to remove all translations and start fresh

## 🏗️ Project Structure

```
translang-real_time_speech_to_translated_transcription_app/
├── app/
│   ├── api/
│   │   └── soniox-temp-key/    # API route for temporary key generation
│   │       └── route.ts
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/
│   ├── TranscriptDisplay.tsx    # Translation display component
│   └── TranslatorControls.tsx   # Control panel component
├── hooks/
│   └── useTranslator.ts         # Main translation hook with state management
├── types/
│   └── soniox.ts                # TypeScript type definitions for Soniox API
├── utils/
│   └── tokenParser.ts           # Token parsing and text processing utilities
├── .env.local                   # Environment variables (create this)
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server at `http://localhost:3000` |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint to check code quality |

## 🎯 How It Works

1. **Microphone Capture**: The application captures audio from your microphone using the Web Audio API
2. **Streaming to Soniox**: Audio is streamed in real-time to the Soniox Speech-to-Text API
3. **Translation Processing**: Soniox performs simultaneous speech recognition and German-to-English translation
4. **Token Parsing**: Incoming tokens are parsed and classified as either:
   - **Final tokens**: Confirmed, immutable translations
   - **Partial tokens**: Live, updating translations that may change
5. **UI Updates**: The interface updates in real-time to display both final and live translations
6. **Text Finalization**: When you stop speaking or pause, partial translations are finalized and committed

## 🔒 Security

- API keys are stored server-side only (`.env.local`)
- Temporary keys are generated for client-side use
- Environment variables are never exposed to the browser
- All audio processing happens locally before streaming

## 🌐 Browser Compatibility

TransLang works best in modern browsers with full WebRTC and MediaStream support:

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome | ✅ | Recommended |
| Firefox | ✅ | Full support |
| Safari | ✅ | Requires microphone permission |
| Edge | ✅ | Full support |
| Opera | ✅ | Full support |

## 🐛 Troubleshooting

### Microphone Not Working
- Ensure you've granted microphone permissions in your browser
- Check that your microphone is not in use by another application
- Try refreshing the page and granting permission again

### Translation Not Appearing
- Verify your `SONIOX_API_KEY` is correctly set in `.env.local`
- Check the browser console (F12) for error messages
- Ensure you're speaking clearly and at a normal volume

### High Latency
- Check your internet connection speed
- Close unnecessary browser tabs
- Try restarting the development server

### "Connection Failed" Error
- Verify your Soniox API key is valid and active
- Check that your API key has translation permissions enabled
- Ensure you haven't exceeded your API quota

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the browser console for error messages
3. Open an issue on GitHub with detailed information about the problem

## 🙏 Acknowledgments

- [Soniox](https://soniox.com/) for their powerful speech-to-text and translation API
- [Next.js](https://nextjs.org/) team for the excellent React framework
- [Vercel](https://vercel.com/) for deployment platform

---

**Made with ❤️ for real-time communication**
