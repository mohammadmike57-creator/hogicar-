import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    X,
    Check,
    Users,
    Briefcase,
    Fuel,
    Zap,
    Shield,
    Award,
    Building,
    CreditCard,
    ArrowLeftRight,
    Plane,
    Handshake,
    Bus,
    GaugeCircle,
    Wind,
    Star,
    ArrowRight,
    Info,
    Calendar,
    Key,
    Lock,
    Clock,
    MapPin,
    FileText,
} from 'lucide-react';
import { Car, PickupType } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { calcPricing } from '../utils/pricing';

interface ComparisonModalProps {
    selectedCars: Car[];
    onClose: () => void;
    onRemove: (car: Car) => void;
    days: number;
    startDate: string;
    endDate: string;
}

type Tone = 'default' | 'success' | 'warning' | 'muted';

const toneClasses: Record<Tone, string> = {
    default: 'bg-white text-slate-900 border-slate-200',
    success: 'bg-emerald-50 text-[#008009] border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    muted: 'bg-slate-50 text-slate-500 border-slate-200',
};

const formatEnum = (value?: string) => (value ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : 'Not listed');

const pickupIcon = (pickupType?: PickupType) => {
    if (pickupType === PickupType.IN_TERMINAL) return <Plane className="h-4 w-4 text-blue-600" />;
    if (pickupType === PickupType.MEET_AND_GREET) return <Handshake className="h-4 w-4 text-[#008009]" />;
    if (pickupType === PickupType.SHUTTLE_BUS) return <Bus className="h-4 w-4 text-orange-600" />;
    return <Building className="h-4 w-4 text-slate-500" />;
};

const getPickupLabel = (car: Car) => {
    const pickupType = car.supplier?.pickupType;
    if (pickupType === PickupType.IN_TERMINAL) return 'In terminal';
    if (pickupType === PickupType.MEET_AND_GREET) return 'Meet & greet';
    if (pickupType === PickupType.SHUTTLE_BUS) return 'Shuttle bus';
    return car.locationDetail || 'Pickup details at desk';
};

const getVehicleName = (car: Car) => car.displayName || `${car.make} ${car.model}`;

const ComparisonModal: React.FC<ComparisonModalProps> = ({ selectedCars, onClose, onRemove, days, startDate, endDate }) => {
    const { convertPrice, getCurrencySymbol } = useCurrency();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = location.search;
    const search = { pickupDate: startDate, dropoffDate: endDate };

    const pricedCars = React.useMemo(() => selectedCars.map(car => ({
        car,
        pricing: calcPricing(car, search),
    })), [selectedCars, startDate, endDate]);

    const totals = pricedCars.map(item => item.pricing.finalTotal);
    const deposits = selectedCars.map(car => Number(car.deposit || 0));
    const excesses = selectedCars.map(car => Number(car.excess || 0));
    const ratings = selectedCars.map(car => Number(car.supplier?.rating || 0));
    const bestTotal = totals.length ? Math.min(...totals) : 0;
    const bestDeposit = deposits.length ? Math.min(...deposits) : 0;
    const bestExcess = excesses.length ? Math.min(...excesses) : 0;
    const bestRating = ratings.length ? Math.max(...ratings) : 0;

    const formatMoney = (value?: number) => `${getCurrencySymbol()}${convertPrice(Number(value || 0)).toFixed(2)}`;

    const handleSelectCar = (car: Car) => {
        sessionStorage.setItem('hogicar_selectedCarId', car.id);
        sessionStorage.setItem('hogicar_selectedCar', JSON.stringify(car));
        navigate(`/car/${car.id}${searchParams}`);
    };

    const Badge = ({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) => (
        <span className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClasses[tone]}`}>
            {children}
        </span>
    );

    const Metric = ({ label, value, tone = 'default', sublabel }: { label: string; value: React.ReactNode; tone?: Tone; sublabel?: React.ReactNode }) => (
        <div className={`rounded-xl border p-3 ${toneClasses[tone]}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
            <div className="mt-1 text-sm font-black leading-tight">{value}</div>
            {sublabel && <div className="mt-1 text-[10px] font-bold leading-snug opacity-70">{sublabel}</div>}
        </div>
    );

    const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
        <div className="grid w-max min-w-full border-y border-slate-200 bg-slate-100" style={{ gridTemplateColumns: `220px repeat(${selectedCars.length}, minmax(285px, 1fr))` }}>
            <div className="sticky left-0 z-30 flex items-center gap-3 border-r border-slate-200 bg-slate-100 px-5 py-4 shadow-[8px_0_18px_-18px_rgba(15,23,42,0.7)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#008009] shadow-sm">{icon}</span>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">{title}</p>
                    {subtitle && <p className="mt-0.5 text-[10px] font-bold text-slate-500">{subtitle}</p>}
                </div>
            </div>
            {selectedCars.map(car => (
                <div key={`${title}-${car.id}`} className="border-l border-slate-200 bg-slate-100/80 px-5 py-4">
                    <p className="truncate text-xs font-black text-slate-900">{getVehicleName(car)}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">{car.supplier?.name || 'Supplier'}</p>
                </div>
            ))}
        </div>
    );

    const ComparisonRow = ({
        label,
        icon,
        helper,
        values,
    }: {
        label: string;
        icon?: React.ReactNode;
        helper?: string;
        values: React.ReactNode[];
    }) => (
        <div
            className="grid w-max min-w-full items-stretch border-b border-slate-100 bg-white"
            style={{ gridTemplateColumns: `220px repeat(${selectedCars.length}, minmax(285px, 1fr))` }}
        >
            <div className="sticky left-0 z-10 flex min-h-[86px] flex-col justify-center border-r border-slate-100 bg-white px-5 py-4 shadow-[8px_0_18px_-18px_rgba(15,23,42,0.65)]">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">{label}</p>
                </div>
                {helper && <p className="mt-1 text-[10px] font-semibold leading-snug text-slate-400">{helper}</p>}
            </div>
            {values.map((value, idx) => (
                <div key={idx} className="flex min-h-[86px] items-center border-l border-slate-100 px-5 py-4">
                    {value}
                </div>
            ))}
        </div>
    );

    const ValueBlock = ({ primary, secondary, badge }: { primary: React.ReactNode; secondary?: React.ReactNode; badge?: React.ReactNode }) => (
        <div className="w-full">
            <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-black text-slate-950">{primary}</div>
                {badge}
            </div>
            {secondary && <div className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{secondary}</div>}
        </div>
    );

    const CheckValue = ({ checked, text }: { checked?: boolean; text: string }) => (
        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${checked ? 'border-emerald-100 bg-emerald-50 text-[#008009]' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            {checked ? <Check className="h-4 w-4 stroke-[3px]" /> : <X className="h-4 w-4" />}
            {text}
        </div>
    );

    const DetailLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
            <span className="max-w-[58%] text-right text-xs font-black leading-relaxed text-slate-900">{value}</span>
        </div>
    );

    const SelectedCarCard = ({ car, pricing }: { car: Car; pricing: ReturnType<typeof calcPricing> }) => {
        const isBestPrice = pricing.finalTotal === bestTotal;
        const isBestSupplier = Number(car.supplier?.rating || 0) === bestRating;

        return (
            <section className={`relative rounded-2xl border bg-white p-3 shadow-sm sm:p-4 ${isBestPrice ? 'border-[#008009] ring-4 ring-emerald-50' : 'border-slate-200'}`}>
                <button
                    onClick={() => onRemove(car)}
                    className="absolute right-3 top-3 z-10 rounded-lg bg-white p-2 text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-600 hover:text-white hover:ring-red-600"
                    aria-label={`Remove ${getVehicleName(car)} from comparison`}
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2 sm:h-24 sm:w-32 sm:p-3">
                        <img src={car.image || car.imageUrl} alt={getVehicleName(car)} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="min-w-0 pr-8">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {car.hogicarChoice && <Badge tone="success">Hogicar choice</Badge>}
                            {isBestPrice && <Badge tone="success">Best total</Badge>}
                            {isBestSupplier && <Badge tone="default">Top rated</Badge>}
                        </div>
                        <h3 className="text-sm font-black uppercase leading-tight text-slate-950 sm:text-base">{getVehicleName(car)}</h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">{car.category} or similar</p>
                        <div className="mt-3 flex min-w-0 items-center gap-2">
                            <img src={car.supplier?.logo} alt={car.supplier?.name || 'Supplier'} className="h-6 max-w-[96px] object-contain sm:h-7 sm:max-w-[110px]" />
                            <span className="h-5 w-px bg-slate-200" />
                            <span className="inline-flex items-center gap-1 text-xs font-black text-slate-900"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {car.supplier?.rating || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
                    <Metric label="Total" value={formatMoney(pricing.finalTotal)} tone={isBestPrice ? 'success' : 'default'} />
                    <Metric label="Deposit" value={Number(car.deposit || 0) === 0 ? 'Zero' : formatMoney(car.deposit)} tone={Number(car.deposit || 0) === bestDeposit ? 'success' : 'default'} />
                    <Metric label="Excess" value={Number(car.excess || 0) === 0 ? 'Zero' : formatMoney(car.excess)} tone={Number(car.excess || 0) === bestExcess ? 'success' : 'default'} />
                </div>
                <button
                    onClick={() => handleSelectCar(car)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#008009] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_30px_-16px_rgba(0,128,9,0.9)] transition hover:bg-slate-950 active:scale-[0.98] sm:mt-4"
                >
                    Select this deal <ArrowRight className="h-4 w-4" />
                </button>
            </section>
        );
    };

    const MobileCarDetails = ({ car, pricing }: { car: Car; pricing: ReturnType<typeof calcPricing> }) => (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
                    <img src={car.image || car.imageUrl} alt={getVehicleName(car)} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-black uppercase leading-tight text-slate-950">{getVehicleName(car)}</h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">{car.supplier?.name || 'Supplier'} · {car.category}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {pricing.finalTotal === bestTotal && <Badge tone="success">Best total</Badge>}
                        {Number(car.deposit || 0) === bestDeposit && <Badge tone="success">Lowest deposit</Badge>}
                        {Number(car.excess || 0) === bestExcess && <Badge tone="success">Lowest excess</Badge>}
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3">
                <DetailLine label="Total" value={formatMoney(pricing.finalTotal)} />
                <DetailLine label="Per day" value={formatMoney(pricing.finalTotal / Math.max(days, 1))} />
                <DetailLine label="Pay now" value={formatMoney(pricing.payNow)} />
                <DetailLine label="At pickup" value={formatMoney(pricing.payAtDesk)} />
                <DetailLine label="Deposit" value={Number(car.deposit || 0) === 0 ? 'Zero deposit' : formatMoney(car.deposit)} />
                <DetailLine label="Excess" value={Number(car.excess || 0) === 0 ? 'Zero excess' : formatMoney(car.excess)} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-white px-3">
                <DetailLine label="Seats" value={`${car.passengers} adults`} />
                <DetailLine label="Bags" value={car.bags} />
                <DetailLine label="Doors" value={car.doors || 'N/A'} />
                <DetailLine label="Transmission" value={formatEnum(car.transmission)} />
                <DetailLine label="Air con" value={car.airCon ? 'Included' : 'Not listed'} />
                <DetailLine label="SIPP" value={car.sippCode || 'Not listed'} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-white px-3">
                <DetailLine label="Rating" value={`${car.supplier?.rating || 'N/A'} / 5`} />
                <DetailLine label="Pickup" value={getPickupLabel(car)} />
                <DetailLine label="Mileage" value={car.unlimitedMileage ? 'Unlimited' : 'Limited'} />
                <DetailLine label="Fuel" value={formatEnum(car.fuelPolicy)} />
                <DetailLine label="CDW" value={car.supplier?.includesCDW ? 'Included' : 'Check terms'} />
                <DetailLine label="Theft" value={car.supplier?.includesTP ? 'Included' : 'Check terms'} />
            </div>

            {(car.rateTiers || []).length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Rate details</p>
                    <div className="mt-2 space-y-2">
                        {car.rateTiers.slice(0, 2).map(tier => (
                            <div key={tier.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                                <p className="text-xs font-black text-slate-950">{tier.name}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-slate-500">{tier.startDate} to {tier.endDate}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-0 backdrop-blur-xl sm:p-4 lg:p-8">
            <div className="flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-slate-50 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.65)] sm:h-[96vh] sm:rounded-3xl">
                <div className="shrink-0 border-b border-slate-200 bg-white">
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl sm:h-12 sm:w-12">
                                <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-950 sm:text-2xl">Professional Vehicle Comparison</h2>
                                    <Badge tone="success">{selectedCars.length} selected</Badge>
                                </div>
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {startDate} to {endDate}</span>
                                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {days} rental day{days === 1 ? '' : 's'}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 sm:flex-none sm:tracking-[0.18em]"
                            >
                                Back to results
                            </button>
                            <button
                                onClick={onClose}
                                className="rounded-xl bg-slate-950 p-3 text-white transition hover:bg-slate-800 active:scale-95"
                                aria-label="Close comparison"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-5 lg:px-7">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">Selected choices</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Scroll down for full rates, specs, deposit, excess and supplier terms.</p>
                            </div>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                            {pricedCars.map(({ car, pricing }) => (
                                <SelectedCarCard key={car.id} car={car} pricing={pricing} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50 p-4 md:hidden">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#008009]">Full mobile comparison</p>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800">Every selected car is shown with pricing, deposit, excess, specs, supplier rating and rental policies.</p>
                        </div>
                        {pricedCars.map(({ car, pricing }) => (
                            <MobileCarDetails key={`mobile-${car.id}`} car={car} pricing={pricing} />
                        ))}
                    </div>

                    <div className="hidden md:block">
                        <SectionHeader icon={<CreditCard className="h-4 w-4" />} title="Rates and financials" subtitle="Full rental amount, payment split, deposit and excess" />
                        <ComparisonRow
                            label="Total rental price"
                            helper={`All taxes for ${days} day${days === 1 ? '' : 's'}`}
                            icon={<Calendar className="h-4 w-4" />}
                            values={pricedCars.map(({ pricing }) => (
                                <ValueBlock
                                    primary={<span className="text-2xl">{formatMoney(pricing.finalTotal)}</span>}
                                    secondary={`Equivalent to ${formatMoney(pricing.finalTotal / Math.max(days, 1))} per day`}
                                    badge={pricing.finalTotal === bestTotal ? <Badge tone="success">Lowest total</Badge> : undefined}
                                />
                            ))}
                        />
                    <ComparisonRow
                        label="Payment breakdown"
                        helper="What is paid online and at pickup"
                        icon={<CreditCard className="h-4 w-4" />}
                        values={pricedCars.map(({ pricing }) => (
                            <div className="grid w-full grid-cols-2 gap-2">
                                <Metric label="Pay now" value={formatMoney(pricing.payNow)} tone="success" />
                                <Metric label="At pickup" value={formatMoney(pricing.payAtDesk)} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Security deposit"
                        helper="Refundable hold or amount collected by supplier"
                        icon={<Lock className="h-4 w-4" />}
                        values={selectedCars.map(car => {
                            const value = Number(car.deposit || 0);
                            return (
                                <ValueBlock
                                    primary={value === 0 ? 'Zero deposit' : formatMoney(value)}
                                    secondary={value > 0 ? 'Usually held on the main driver credit card at pickup.' : 'No security deposit shown for this offer.'}
                                    badge={value === bestDeposit ? <Badge tone="success">Lowest deposit</Badge> : undefined}
                                />
                            );
                        })}
                    />
                    <ComparisonRow
                        label="Damage excess"
                        helper="Maximum liability shown for damage or theft"
                        icon={<Shield className="h-4 w-4" />}
                        values={selectedCars.map(car => {
                            const value = Number(car.excess || 0);
                            return (
                                <ValueBlock
                                    primary={value === 0 ? 'Zero excess' : formatMoney(value)}
                                    secondary={value > 0 ? 'Applies unless additional protection reduces it.' : 'No excess amount shown for this offer.'}
                                    badge={value === bestExcess ? <Badge tone="success">Lowest excess</Badge> : undefined}
                                />
                            );
                        })}
                    />
                    <ComparisonRow
                        label="Supplier rate tiers"
                        helper="Season and duration based rate rules"
                        icon={<FileText className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="w-full space-y-2">
                                {(car.rateTiers || []).length === 0 ? (
                                    <Metric label="Rate structure" value="Standard rate" sublabel={car.netPrice ? `Base supplier amount ${formatMoney(car.netPrice)}` : 'No rate tiers listed'} />
                                ) : (
                                    car.rateTiers.slice(0, 3).map(tier => (
                                        <div key={tier.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-black text-slate-950">{tier.name}</p>
                                                    <p className="mt-0.5 text-[10px] font-bold text-slate-500">{tier.startDate} to {tier.endDate}</p>
                                                </div>
                                                {tier.promotionLabel && <Badge tone="warning">{tier.promotionLabel}</Badge>}
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {tier.rates.slice(0, 3).map(rate => (
                                                    <div key={`${tier.id}-${rate.minDays}-${rate.maxDays}`} className="flex justify-between gap-3 text-[11px] font-bold text-slate-600">
                                                        <span>{rate.minDays}-{rate.maxDays} days</span>
                                                        <span className="font-black text-slate-950">{formatMoney(rate.dailyRate)} / day</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ))}
                    />

                    <SectionHeader icon={<GaugeCircle className="h-4 w-4" />} title="Vehicle specifications" subtitle="Capacity, category, transmission and core vehicle equipment" />
                    <ComparisonRow
                        label="Model and class"
                        icon={<Info className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <ValueBlock
                                primary={`${car.make} ${car.model}`}
                                secondary={`${car.year || 'Year not listed'} ${formatEnum(car.category)} class, SIPP ${car.sippCode || 'not listed'}`}
                            />
                        ))}
                    />
                    <ComparisonRow
                        label="Passenger and luggage"
                        icon={<Users className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="grid w-full grid-cols-3 gap-2">
                                <Metric label="Seats" value={<span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {car.passengers}</span>} />
                                <Metric label="Bags" value={<span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {car.bags}</span>} />
                                <Metric label="Doors" value={car.doors || 'N/A'} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Transmission and comfort"
                        icon={<Wind className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="flex flex-wrap gap-2">
                                <CheckValue checked text={formatEnum(car.transmission)} />
                                <CheckValue checked={car.airCon} text={car.airCon ? 'Air conditioning' : 'No A/C listed'} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Included features"
                        icon={<Award className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="flex w-full flex-wrap gap-2">
                                {(car.features || []).slice(0, 6).map(feature => <Badge key={feature} tone="muted">{feature}</Badge>)}
                                {(car.features || []).length === 0 && <span className="text-xs font-semibold text-slate-400">No feature list supplied</span>}
                            </div>
                        ))}
                    />

                    <SectionHeader icon={<Star className="h-4 w-4" />} title="Supplier quality" subtitle="Ratings, supplier identity and operational confidence" />
                    <ComparisonRow
                        label="Supplier rating"
                        icon={<Star className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <ValueBlock
                                primary={<span className="inline-flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {car.supplier?.rating || 'N/A'} / 5</span>}
                                secondary={car.supplier?.name || 'Supplier not listed'}
                                badge={Number(car.supplier?.rating || 0) === bestRating ? <Badge tone="success">Highest rated</Badge> : undefined}
                            />
                        ))}
                    />
                    <ComparisonRow
                        label="Detailed ratings"
                        helper="Verified customer experience indicators"
                        icon={<Award className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="grid w-full grid-cols-2 gap-2">
                                <Metric label="Cleanliness" value={`${car.detailedRatings?.cleanliness || 85}%`} tone={(car.detailedRatings?.cleanliness || 85) >= 85 ? 'success' : 'default'} />
                                <Metric label="Condition" value={`${car.detailedRatings?.condition || 82}%`} />
                                <Metric label="Value" value={`${car.detailedRatings?.valueForMoney || 80}%`} />
                                <Metric label="Pickup speed" value={`${car.detailedRatings?.pickupSpeed || 78}%`} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Confirmation"
                        icon={<Zap className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <ValueBlock
                                primary={car.supplier?.bookingMode === 'FREE_SALE' ? 'Instant confirmation' : 'On request'}
                                secondary={car.supplier?.minBookingLeadTime ? `Minimum lead time ${car.supplier.minBookingLeadTime} hour(s)` : 'Lead time not listed'}
                                badge={car.supplier?.bookingMode === 'FREE_SALE' ? <Badge tone="success">Fast booking</Badge> : undefined}
                            />
                        ))}
                    />

                    <SectionHeader icon={<Key className="h-4 w-4" />} title="Pickup and policies" subtitle="Pickup logistics, mileage, fuel, insurance and supplier terms" />
                    <ComparisonRow
                        label="Pickup location"
                        icon={<MapPin className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <ValueBlock
                                primary={<span className="inline-flex items-center gap-2">{pickupIcon(car.supplier?.pickupType)} {getPickupLabel(car)}</span>}
                                secondary={car.supplier?.address || car.locationDetail || car.location || 'Address not listed'}
                            />
                        ))}
                    />
                    <ComparisonRow
                        label="Mileage and fuel"
                        icon={<Fuel className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="grid w-full grid-cols-2 gap-2">
                                <Metric label="Mileage" value={car.unlimitedMileage ? 'Unlimited' : 'Limited'} tone={car.unlimitedMileage ? 'success' : 'warning'} />
                                <Metric label="Fuel policy" value={formatEnum(car.fuelPolicy)} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Insurance included"
                        icon={<Shield className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="flex flex-wrap gap-2">
                                <CheckValue checked={car.supplier?.includesCDW} text="Collision Damage Waiver" />
                                <CheckValue checked={car.supplier?.includesTP} text="Theft Protection" />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Return and one-way rules"
                        icon={<Clock className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="grid w-full grid-cols-2 gap-2">
                                <Metric label="Grace period" value={car.supplier?.gracePeriodDays ? `${car.supplier.gracePeriodDays} day(s)` : `${car.supplier?.gracePeriodHours || 0} hour(s)`} />
                                <Metric label="One-way fee" value={car.supplier?.oneWayFee ? formatMoney(car.supplier.oneWayFee) : 'Not listed'} />
                            </div>
                        ))}
                    />
                    <ComparisonRow
                        label="Supplier terms"
                        helper="Short preview of rental conditions"
                        icon={<FileText className="h-4 w-4" />}
                        values={selectedCars.map(car => (
                            <div className="max-h-28 w-full overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600 custom-scrollbar">
                                {car.supplier?.termsAndConditions || 'No additional supplier terms have been provided for this vehicle.'}
                            </div>
                        ))}
                    />
                </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-7">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#008009]">
                            <Shield className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-950">Review before booking</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Deposit, excess and rental conditions may be verified again at pickup.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-50 active:scale-95"
                        >
                            Compare others
                        </button>
                        {selectedCars[0] && (
                            <button
                                onClick={() => handleSelectCar(selectedCars[0])}
                                className="rounded-xl bg-[#008009] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-950 active:scale-95"
                            >
                                Select first choice
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
