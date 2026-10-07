// Square SVG flags bundled with the site (country-flag-icons, MIT), keyed by lowercase country code.
import {
  US, EU, GB, JO, AE, SA, QA, BH, OM, EG, KW, MA, DZ, TN, LY, TR, AU, CA, JP, IN, CH, CN, RU, KR, SG,
  HK, NZ, TH, MY, ID, PH, VN, PK, BD, ZA, BR, MX, IL, PL, SE, NO, DK, CZ, HU,
} from 'country-flag-icons/string/1x1';

const svgs: Record<string, string> = {
  us: US, eu: EU, gb: GB, jo: JO, ae: AE, sa: SA, qa: QA, bh: BH, om: OM, eg: EG, kw: KW, ma: MA, dz: DZ, tn: TN,
  ly: LY, tr: TR, au: AU, ca: CA, jp: JP, in: IN, ch: CH, cn: CN, ru: RU, kr: KR, sg: SG, hk: HK, nz: NZ, th: TH,
  my: MY, id: ID, ph: PH, vn: VN, pk: PK, bd: BD, za: ZA, br: BR, mx: MX, il: IL, pl: PL, se: SE, no: NO, dk: DK,
  cz: CZ, hu: HU,
};

const cache: Record<string, string> = {};

/** Data URI for a country's flag, or '' when it isn't bundled. */
export const flagSrc = (iso: string) => {
  const svg = svgs[iso];
  if (!svg) return '';
  return (cache[iso] ||= `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
};
