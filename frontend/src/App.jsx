import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Overview from './pages/Overview';
import AOIAnalysis from './pages/AOIAnalysis';
import TemporalAnalysis from './pages/TemporalAnalysis';
import Deforestation from './pages/Deforestation';
import Mining from './pages/Mining';
import Flood from './pages/Flood';
import CommonMap from './pages/CommonMap';
import Reports from './pages/Reports';
import Methodology from './pages/Methodology';
import FieldPhotoAnalysis from './pages/FieldPhotoAnalysis';
import Validation from './pages/Validation';
import SatelliteComparison from './pages/SatelliteComparison';
import WelcomePage from './pages/WelcomePage';

export default function App() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/welcome';

  if (isWelcomePage) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/satellite-comparison" element={<SatelliteComparison />} />
            <Route path="/aoi" element={<AOIAnalysis />} />
            <Route path="/field-photo" element={<FieldPhotoAnalysis />} />
            <Route path="/photo-analysis" element={<FieldPhotoAnalysis />} />
            <Route path="/analysis" element={<TemporalAnalysis />} />
            <Route path="/deforestation" element={<Deforestation />} />
            <Route path="/mining" element={<Mining />} />
            <Route path="/flood" element={<Flood />} />
            <Route path="/map" element={<CommonMap />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/methodology" element={<Methodology />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
