const features = [
  {
    title: 'GROCERY ESSENTIALS',
    img: 'https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg?auto=compress&w=800&q=80',
    desc: 'Real-time tracking of essential goods to avoid shortages and maintain stock levels efficiently using ML-driven insights.'
  },
  {
    title: 'GROCERY BASKET',
    img: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&w=800&q=80',
    desc: 'Automated inventory bundling and intelligent restocking ensure your warehouse stays organized and responsive to demand.'
  },
  {
    title: 'FRESH FOODS',
    img: 'https://images.pexels.com/photos/32937515/pexels-photo-32937515.jpeg?auto=compress&w=800&q=80',
    desc: 'Predictive stock alerts and supplier-linked restocking ensure fast-moving perishable items like fruits are always available, fresh, and never overstocked.'
  }
];

export default function OrderSection() {
  return (
    <section id="order" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-12 text-center">
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Discover how FreshNest empowers your warehouse with real-time tracking, automation, and predictive insights for a smarter, fresher supply chain.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center border border-gray-100 hover:border-green-200 group"
            >
              <div className="overflow-hidden rounded-xl w-full h-48 mb-6">
                <img
                  src={f.img}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-bold text-xl mb-2 text-center text-green-700">{f.title}</h3>
              <p className="text-gray-600 text-center text-base leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 