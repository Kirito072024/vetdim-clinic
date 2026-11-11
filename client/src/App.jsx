import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';

// Головна завантажується одразу, інші сторінки — окремими чанками (code splitting)
const Doctors = lazy(() => import('./pages/Doctors.jsx'));
const Doctor = lazy(() => import('./pages/Doctor.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Booking = lazy(() => import('./pages/Booking.jsx'));
const Contacts = lazy(() => import('./pages/Contacts.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const Loading = () => (
  <div className="container section--tight" aria-busy="true">
    <div className="skeleton" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:id" element={<Doctor />} />
          <Route path="services" element={<Services />} />
          <Route path="booking" element={<Booking />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
