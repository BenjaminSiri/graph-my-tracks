// src/styles/GlobalStyle.ts
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: var(--background);
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  :root {
    --spotify-green: #1DB954;
    --background: #191414;
    --surface: #282828;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
  }
`;

export default GlobalStyle;