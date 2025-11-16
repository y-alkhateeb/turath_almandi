/**
 * App Component
 * Main application component with routing
 */

import { useRoutes } from 'react-router-dom';
import { routes } from '@/routes';

function App() {
  return useRoutes(routes);
}

export default App;
