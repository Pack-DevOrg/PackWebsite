/// <reference types="vite-imagetools" />
// Allow JSX elements
import React from 'react';

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module 'styled-components';
declare module 'framer-motion';
declare module 'lucide-react';
