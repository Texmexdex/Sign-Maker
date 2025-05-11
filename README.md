# 3D Sign Creator Web Application

A browser-based tool for creating custom 3D text or logo-based signs. This application allows users to create, preview, and export 3D sign designs for 3D printing or further design work.

## Features

- **Text to 3D Conversion**: Type text and extrude it into 3D shapes
- **SVG Upload Support**: Upload your own vector graphics for 3D conversion
- **Font Selection**: Choose from multiple fonts for your text
- **3D Customization**: Adjust extrusion depth, colors, and bevel settings
- **Interactive 3D Preview**: Rotate, pan, and zoom to inspect your design
- **Export Options**: Download as SVG (2D vector) or STL (3D model) files

## Technical Implementation

This application runs entirely in the browser without requiring any server-side processing. It uses the following technologies:

- **HTML5, CSS3, JavaScript (ES6+)** for the core application
- **Three.js** for 3D rendering and model generation
- **Opentype.js** for font parsing and text-to-path conversion
- **SVGLoader** for processing SVG files

## Project Structure

```
├── index.html              # Main HTML document
├── css/
│   ├── styles.css          # Main application styles
│   └── fontpicker.css      # Font selector styles
├── js/
│   ├── app.js              # Main application logic
│   ├── fontManager.js      # Font loading and processing
│   ├── svgProcessor.js     # SVG file handling
│   ├── modelGenerator.js   # 3D model generation
│   ├── previewRenderer.js  # 3D preview rendering
│   └── exportManager.js    # File export handling
└── fonts/                  # Font files (TTF/OTF)
```

## Running the Application

To run the application locally:

1. Clone or download this repository
2. Set up a local web server in the project directory
   - Using Python: `python -m http.server 8000`
   - Using Node.js: `npx http-server -p 8000`
3. Open a web browser and navigate to `http://localhost:8000`

## Adding Custom Fonts

To add additional fonts to the application:

1. Add the TTF or OTF font files to the `fonts/` directory
2. Edit the `initializeFontList()` method in `js/fontManager.js` to include your new fonts:

```javascript
this.fonts = [
    // Existing fonts
    { name: 'Your Font Name', url: 'fonts/YourFont-Regular.ttf' },
    // Add more fonts as needed
];
```

## Usage

1. **Input Text**: Type the text you want to convert to 3D in the text field
2. **Select Font**: Choose a font from the dropdown menu
3. **Customize Appearance**:
   - Adjust outline color and thickness
   - Set extrusion depth
   - Enable/disable bevels
   - Choose colors for front/back faces and side walls
4. **Update Preview**: Click the "Update Preview" button to see your changes
5. **Interact with 3D Model**: Use mouse to rotate, pan, and zoom
6. **Download Files**:
   - Click "Download SVG" for the 2D vector outline
   - Click "Download STL" for the 3D model ready for printing

## SVG Upload

You can upload your own SVG files instead of using text:

1. Click "Choose File" in the Upload Custom SVG section
2. Select an SVG file from your computer
3. The application will process the SVG and create a 3D model
4. Customize the 3D settings as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) for 3D rendering
- [Opentype.js](https://opentype.js.org/) for font processing
- [Google Fonts](https://fonts.google.com/) for the included fonts