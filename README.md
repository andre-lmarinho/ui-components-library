# UI Components Library

A browsable collection of standalone interface examples. The examples use HyperText Markup Language (HTML), Cascading Style Sheets (CSS), and vanilla JavaScript.

Each row links to an example's HTML, CSS, and JavaScript files. Open an HTML file from a local checkout to view it. Copy and adapt the files for your project.

Originally created for [iCodeThis](https://icodethis.com/) challenges.

- [iCodeThis profile](https://icodethis.com/Andre_Marinho)
- [CodePen profile](https://codepen.io/andre-lmarinho)

## Examples

| Component | HTML | CSS | JavaScript | Behavior |
|---|---|---|---|---|
| Card hover effect | [HTML](card-hover-effect/index.html) | [CSS](card-hover-effect/style.css) | [JavaScript](card-hover-effect/script.js) | Moves cards with pointer position |
| Chip navigation | [HTML](chip-navigation/index.html) | [CSS](chip-navigation/style.css) | [JavaScript](chip-navigation/script.js) | Scrolls to page sections and syncs the selected chip |
| Content toggle | [HTML](content-toggle/index.html) | [CSS](content-toggle/style.css) | [JavaScript](content-toggle/script.js) | Switches panels by click, Enter, or Space; arrow keys move focus |
| Feature carousel | [HTML](feature-carousel/index.html) | [CSS](feature-carousel/style.css) | [JavaScript](feature-carousel/script.js) | Syncs pointer-drag media with cards; dots and cards select slides |
| Logo carousel | [HTML](logo-carousel/index.html) | [CSS](logo-carousel/style.css) | [JavaScript](logo-carousel/script.js) | Loops logos and slows on hover; stops for reduced motion |
| Mobile menu toggle | [HTML](mobile-menu-toggle/index.html) | [CSS](mobile-menu-toggle/style.css) | [JavaScript](mobile-menu-toggle/script.js) | Opens a slide-in menu; closes on Escape or outside click |
| Password field | [HTML](password-field/index.html) | [CSS](password-field/style.css) | [JavaScript](password-field/script.js) | Toggles password visibility and clears the field; no authentication logic |

## Use

The examples need no package install or build step. They use browser APIs and can run as local files.

The CSS imports Inter from Google Fonts. The feature carousel loads sample photos from Picsum, the logo carousel loads vector images from SVGL, and the password example loads an avatar from Pravatar. Those remote assets need an internet connection.

These examples are starting points, not production-ready components. Accessibility support varies. Some examples use semantic controls, accessibility states, focus styles, or keyboard input. Others rely on pointer interaction.

The examples have not been audited for accessibility conformance. Review and test each example before using it in a product.
