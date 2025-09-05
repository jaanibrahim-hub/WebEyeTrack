# EyeTrack Browser Extension

A browser extension that enables eye tracking and gaze navigation with blink-to-click functionality for accessibility and hands-free web browsing.

## 🎯 Features

- **Eye Tracking**: Real-time gaze tracking using your webcam
- **Blink-to-Click**: Double blink to simulate mouse clicks
- **Gaze Cursor**: Visual indicator showing where you're looking
- **Accessibility Focus**: Designed for users with limited mobility
- **Privacy First**: All processing happens locally on your device

## 🚀 Installation

### Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list

### Grant Permissions

1. Click the EyeTrack extension icon in your browser toolbar
2. Click "Start Tracking" 
3. Allow camera access when prompted
4. The extension will initialize and show a status indicator

## 🎮 How to Use

### Demo Mode Controls

This is a demonstration version that simulates eye tracking functionality:

- **Mouse Movement**: Move your mouse to simulate gaze tracking
- **Spacebar**: Press spacebar twice quickly to simulate double blink (click)
- **Camera**: Extension requests camera access for future full implementation

### Real Usage (Full Version)

1. **Start Tracking**: Click the extension icon and press "Start Tracking"
2. **Calibration**: Run calibration for better accuracy (recommended)
3. **Navigate**: Look around the screen to move the gaze cursor
4. **Click**: Double blink to click on elements
5. **Settings**: Adjust sensitivity and other options in the popup

## ⚙️ Settings

Access settings through:
- Extension popup (quick settings)
- Options page (advanced settings)

### Available Settings

- **Show Gaze Cursor**: Toggle visibility of the gaze indicator
- **Blink Sensitivity**: Adjust how sensitive blink detection is
- **Gaze Smoothness**: Control how smooth cursor movement appears
- **Update Rate**: Balance performance vs battery life
- **Debug Mode**: Enable console logging for troubleshooting

## 🛠️ Development

### Build from Source

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Development with watch mode
npm run dev
```

### Project Structure

```
browser-extension/
├── src/
│   ├── content/           # Content scripts injected into pages
│   ├── background/        # Background service worker
│   └── ...
├── popup/                 # Extension popup interface
├── options/              # Settings/options page
├── assets/               # Icons and resources
└── dist/                 # Built extension files
```

## 🔧 Technical Details

### Architecture

- **Content Script**: Injected into web pages to handle eye tracking and UI
- **Background Worker**: Manages extension lifecycle and cross-tab communication
- **Popup Interface**: Quick controls and status
- **Options Page**: Advanced configuration

### Privacy & Security

- All video processing happens locally on your device
- No data is sent to external servers
- Camera access is only used for eye tracking
- Settings are stored locally in your browser

### Browser Compatibility

- Chrome/Chromium (Manifest V3)
- Edge (Chromium-based)
- Other Chromium browsers

## 🚧 Current Status: Demo Version

This is a demonstration version that shows the concept of eye tracking with blink-to-click. Key features:

✅ **Working**: Browser extension structure, UI, settings, camera permissions
🚧 **Simulated**: Uses mouse position as gaze proxy, spacebar for blink detection
🔜 **Planned**: Full WebEyeTrack integration for real eye tracking

### Demo Controls

- Move mouse = Simulate gaze movement
- Double-press spacebar = Simulate double blink (click)
- Works without actual eye tracking for testing the concept

## 🔮 Future Development

### Planned Features

- [ ] Real eye tracking using WebEyeTrack integration
- [ ] Advanced calibration system
- [ ] Multiple gesture recognition (wink, etc.)
- [ ] Gaze-based scrolling
- [ ] Voice command integration
- [ ] On-screen virtual keyboard
- [ ] Advanced accessibility features

### Integration Roadmap

1. **Phase 1**: Demo version (current) ✅
2. **Phase 2**: Basic eye tracking integration
3. **Phase 3**: Full WebEyeTrack features
4. **Phase 4**: Advanced accessibility features

## 🤝 Contributing

This project is built on the WebEyeTrack framework. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgements

- Built with [WebEyeTrack](https://github.com/redforestai/webeyetrack) framework
- Developed by Vanderbilt University researchers
- Supported by the Institute of Education Sciences, U.S. Department of Education

## 📞 Support

For issues and questions:
1. Check the Help section in the extension options
2. Review troubleshooting guide
3. Enable debug mode for console logs
4. Report issues in the GitHub repository

---

**Note**: This is a research project demonstrating accessible web browsing technology. The demo version simulates eye tracking functionality while the full implementation is being developed.