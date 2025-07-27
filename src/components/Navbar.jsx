import { Link } from 'react-router-dom';

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white z-50 shadow flex justify-between items-center px-8 py-4">
      <div className="font-extrabold text-2xl tracking-widest text-black uppercase select-none" style={{ letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif' }}>
        FRESHNEST
      </div>
      <div className="flex items-center gap-4">
        <a
          href="#contact"
          onClick={e => {
            e.preventDefault();
            scrollToSection('contact');
          }}
          className="px-4 py-2 rounded font-medium text-gray-700 hover:bg-gray-100 hover:text-green-700 transition-colors duration-200"
        >
          Contact
        </a>
        <Link
          to="/login"
          className="px-4 py-2 rounded font-medium border border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-colors duration-200 shadow-sm"
        >
          Login
        </Link>
        <Link
          to="/login?role=retailer"
          className="px-5 py-2 rounded-full font-bold bg-gradient-to-r from-green-700 to-green-500 text-white shadow-lg border-2 border-green-800 hover:from-green-800 hover:to-green-600 hover:text-white focus:text-white transition-all duration-200 text-base tracking-wide"
          style={{ color: 'white' }}
        >
          I'm a Retailer – Let’s Go
        </Link>
      </div>
    </nav>
  );
} 