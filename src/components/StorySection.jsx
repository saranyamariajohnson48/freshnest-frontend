import { scrollToSection } from './Navbar';

export default function StorySection() {
  return (
    <section id="story" className="py-16 bg-green-50 text-center text-gray-900">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">From our warehouse to your table, every step is powered by innovation and care.</h2>
      <button
        onClick={() => scrollToSection('contact')}
        className="bg-green-600 text-white px-8 py-3 rounded font-semibold hover:bg-green-700 transition"
      >
        Get in touch
      </button>
    </section>
  );
} 