import Navbar from './Navbar';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <section
        className="flex flex-col items-center justify-center text-white text-center h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1500&q=80')" }}
      >
        <div className="mt-32">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-8 drop-shadow-lg">
            Smart, Fresh, and Efficient Warehouse Management
          </h1>
          <a href="#order" className="inline-block bg-white text-black font-semibold px-8 py-4 rounded shadow hover:bg-green-100 transition">
            See our solutions
          </a>
        </div>
      </section>
    </div>
  );
} 