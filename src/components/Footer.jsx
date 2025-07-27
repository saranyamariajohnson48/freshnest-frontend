export default function Footer() {
  return (
    <footer className="bg-green-50 border-t py-8 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left gap-8">
        <div className="flex-1">
          <div className="font-semibold mb-2">The best quality produce – from us to you</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold mb-2">Contact</div>
          <div>701-931-6988</div>
          <div>hello@freshnest.com</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold mb-2">Address</div>
          <div>1420 Willis Avenue</div>
          <div>Jacksonville, FL 32216</div>
        </div>
      </div>
    </footer>
  );
} 