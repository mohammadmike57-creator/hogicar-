import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, Shield, ChevronDown, Award, MapPin } from "lucide-react";
import { SUPPLIERS, MOCK_HOMEPAGE_CONTENT } from "../services/mockData";
import SEOMetadata from "../components/SEOMetadata";
import { useCurrency } from "../contexts/CurrencyContext";
import SearchWidget from "../components/SearchWidget";
import { fetchLocations } from "../api";
import { LocationSuggestion } from "../api";

const Home: React.FC = () => {
const navigate = useNavigate();
const { convertPrice, getCurrencySymbol } = useCurrency();
const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

const [pickupCode, setPickupCode] = React.useState("");
const [dropoffCode, setDropoffCode] = React.useState("");
const [pickupName, setPickupName] = React.useState("");
const [dropoffName, setDropoffName] = React.useState("");

React.useEffect(() => {
const loadLocations = async () => {
try {
const options = await fetchLocations("");
const amm = options.find((o) => o.value === "AMM");
if (amm) {
setPickupName(amm.label);
setDropoffName(amm.label);
}
} catch (e) {
console.error(e);
}
};
loadLocations();
}, []);

const handleSearch = (params: any) => {
const searchParams = new URLSearchParams(params);
navigate("/searching?" + searchParams.toString());
};

const content = MOCK_HOMEPAGE_CONTENT;
const faqs = content.faqs.items;
const destinations = content.popularDestinations.destinations;

return ( <div className="bg-white text-slate-900">

```
  <SEOMetadata
    title="Hogicar | Affordable Car Rentals Worldwide"
    description="Compare car rental deals from hundreds of suppliers worldwide."
  />

  {/* HERO */}
  <section className="bg-[#003580] pt-16 pb-14 text-center text-white">
    <div className="max-w-5xl mx-auto px-4">

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
        Search, Compare & Save on
        <span className="text-orange-400"> Car Rentals</span>
      </h1>

      <p className="text-blue-100 mb-8">
        Compare prices from hundreds of suppliers worldwide.
      </p>

      <SearchWidget
        onSearch={handleSearch}
        showTitle={false}
        initialValues={{
          pickup: pickupCode,
          pickupName: pickupName,
          dropoff: dropoffCode,
          dropoffName: dropoffName
        }}
      />

      <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">

        <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded">
          <CheckCircle className="w-4 h-4 text-green-400" />
          Free Cancellation
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded">
          <Shield className="w-4 h-4 text-blue-300" />
          No Hidden Fees
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded">
          <Award className="w-4 h-4 text-orange-300" />
          24/7 Support
        </div>

      </div>
    </div>
  </section>

  {/* SUPPLIERS */}
  <section className="py-10 border-b">
    <div className="max-w-6xl mx-auto px-4 text-center mb-6">
      <h2 className="text-2xl font-bold">
        Trusted by the world's leading car rental suppliers
      </h2>
    </div>

    <div className="flex flex-wrap justify-center gap-10 px-6 opacity-80">
      {SUPPLIERS.map((s) => (
        <img
          key={s.id}
          src={s.logo}
          alt={s.name}
          className="h-12 w-auto object-contain grayscale hover:grayscale-0"
        />
      ))}
    </div>
  </section>

  {/* DESTINATIONS */}
  <section className="py-12 bg-slate-50">
    <div className="max-w-6xl mx-auto px-4">

      <h3 className="text-3xl font-bold mb-8">
        Popular Destinations
      </h3>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {destinations.slice(0,5).map((dest) => (
          <Link
            key={dest.name}
            to={"/search?location=" + dest.name}
            className="relative rounded-xl overflow-hidden text-white"
          >

            <img
              src={dest.image}
              alt={dest.name}
              className="w-full h-40 object-cover"
            />

            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4">
              <h4 className="font-bold">{dest.name}</h4>
              <span className="text-xs">
                {getCurrencySymbol()}{convertPrice(dest.price)}
              </span>
            </div>

          </Link>
        ))}
      </div>

    </div>
  </section>

  {/* FAQ */}
  <section className="py-12">
    <div className="max-w-3xl mx-auto px-4">

      {faqs.map((faq, i) => (
        <div key={faq.id} className="bg-white border rounded mb-3">

          <button
            onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
            className="w-full flex justify-between p-4 font-semibold"
          >
            {faq.question}
            <ChevronDown />
          </button>

          {openFaqIndex === i && (
            <div className="p-4 text-sm text-slate-600">
              {faq.answer}
            </div>
          )}

        </div>
      ))}

    </div>
  </section>

</div>
```

);
};

export default Home;
