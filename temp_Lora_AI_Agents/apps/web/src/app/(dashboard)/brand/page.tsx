'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  RefreshCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useAnalyzeBrandWebsite,
  useBrandDocuments,
  useBrandProfile,
  useResetBrand,
  useUpdateBrand,
} from '@/lib/hooks/useBrand';

const BUILD_STEPS = [
  'Website Analyse',
  'Business Identification',
  'Analysing Competitor',
  'Analysing Brand Assets',
  'Building your knowledge',
] as const;

const DOC_LABELS: Record<string, string> = {
  business_profile: 'Profile Identity',
  market_research: 'Market research',
  social_strategy: 'Strategy',
  brand_guidelines: 'Brand Guidelines',
  visual_intelligence: 'SEO/GEO keywords',
};

const SECTION_FILTERS = ['All', 'Documents', 'Brand Guidelines'] as const;
const BRAND_SECTION_STORAGE_KEY = 'loraloop-brand-section-filter';
const BRAND_URL_STORAGE_KEY = 'loraloop-brand-website-url';

type SectionFilter = (typeof SECTION_FILTERS)[number];

export default function BrandPage() {
  const { data: brand, isLoading } = useBrandProfile();
  const documents = useBrandDocuments();
  const analyze = useAnalyzeBrandWebsite();
  const saveBrand = useUpdateBrand();
  const resetBrand = useResetBrand();

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [section, setSection] = useState<SectionFilter>('All');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedSection = window.localStorage.getItem(BRAND_SECTION_STORAGE_KEY);
    const savedUrl = window.localStorage.getItem(BRAND_URL_STORAGE_KEY);

    if (savedSection && SECTION_FILTERS.includes(savedSection as SectionFilter)) {
      setSection(savedSection as SectionFilter);
    }
    if (savedUrl) {
      setWebsiteUrl(savedUrl);
    }
  }, []);

  useEffect(() => {
    if (brand?.websiteUrl) {
      setWebsiteUrl(brand.websiteUrl);
    }
  }, [brand?.websiteUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BRAND_SECTION_STORAGE_KEY, section);
  }, [section]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (websiteUrl.trim()) {
      window.localStorage.setItem(BRAND_URL_STORAGE_KEY, websiteUrl);
    } else {
      window.localStorage.removeItem(BRAND_URL_STORAGE_KEY);
    }
  }, [websiteUrl]);

  useEffect(() => {
    if (brand?.websiteUrl || brand?.brandName) {
      void documents.refetch();
    }
  }, [brand?.websiteUrl, brand?.brandName, documents]);

  const hasKnowledge = Boolean(
    brand?.websiteUrl ||
      brand?.brandName ||
      brand?.lastValidatedAt ||
      brand?.referenceImages?.length,
  );

  const docEntries = useMemo(
    () =>
      Object.entries(DOC_LABELS).map(([key, label]) => ({
        key,
        label,
        url: documents.data?.[key] ?? null,
        content: brand?.documents?.[key as keyof typeof brand.documents] ?? '',
      })),
    [brand?.documents, documents.data],
  );

  const renderEntry = !hasKnowledge && !analyze.isPending;
  const renderProgress = analyze.isPending;
  const renderKnowledge = hasKnowledge && !analyze.isPending;

  const handleAnalyze = async () => {
    const value = websiteUrl.trim();
    if (!value) return;
    setNotice('');
    try {
      await analyze.mutateAsync(value);
      await documents.refetch();
      setSection('All');
      setNotice('Knowledge base saved locally. It will stay here when you switch pages or tabs.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not analyze this website.');
    }
  };

  const handleSave = async () => {
    if (!brand) return;
    await saveBrand.mutateAsync({
      brandName: brand.brandName,
      industry: brand.industry,
      targetAudience: brand.targetAudience,
      productDescription: brand.productDescription,
      valueProposition: brand.valueProposition,
      websiteUrl: brand.websiteUrl,
      tone: brand.tone,
      logoUrl: brand.logoUrl,
      pagesScraped: brand.pagesScraped,
      referenceImages: brand.referenceImages,
      brandColors: brand.brandColors,
      contentPillars: brand.contentPillars,
      voiceCharacteristics: brand.voiceCharacteristics,
    });
    setNotice('Knowledge base saved. Nothing will be reset unless you press Reset.');
  };

  const handleReset = async () => {
    await resetBrand.mutateAsync();
    setWebsiteUrl('');
    setSection('All');
    setNotice('');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top,#eef4ff_0%,#fbfdff_45%,#ffffff_100%)]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2D78F4]" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,#eef4ff_0%,#fbfdff_45%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {renderEntry && (
          <EntryState
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            onAnalyze={handleAnalyze}
            isPending={analyze.isPending}
            notice={notice}
          />
        )}

        {renderProgress && (
          <ProgressState websiteUrl={websiteUrl} activeStep={0} />
        )}

        {renderKnowledge && brand && (
          <KnowledgeState
            brand={brand}
            documents={docEntries}
            section={section}
            onSectionChange={setSection}
          />
        )}
      </div>

      {renderKnowledge && brand && (
        <footer className="sticky bottom-0 border-t border-[#E6ECF7] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-6 py-4">
            <Button
              variant="ghost"
              onClick={handleReset}
              loading={resetBrand.isPending}
              className="rounded-full px-8 py-3 text-base text-slate-600 hover:bg-slate-100"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              loading={saveBrand.isPending}
              className="rounded-full bg-[#2D78F4] px-10 py-3 text-base font-semibold text-white hover:bg-[#1f6ae5]"
            >
              <Save className="h-4 w-4" />
              Looks Good
            </Button>
          </div>
          <p className="px-6 text-center text-xs text-slate-400">
            Your generated knowledge base stays saved locally until you explicitly reset it.
          </p>
          {notice && <p className="pb-3 text-center text-sm text-[#2D78F4]">{notice}</p>}
        </footer>
      )}
    </div>
  );
}

function EntryState({
  websiteUrl,
  setWebsiteUrl,
  onAnalyze,
  isPending,
  notice,
}: {
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  onAnalyze: () => void;
  isPending: boolean;
  notice: string;
}) {
  return (
    <div className="flex min-h-[74vh] items-center justify-center">
      <div className="w-full max-w-[760px] rounded-[38px] border border-[#E4EBF5] bg-white px-10 py-12 shadow-[0_18px_55px_rgba(133,160,215,0.16)]">
        <div className="text-center">
          <h1 className="text-6xl font-semibold tracking-tight text-slate-800">Enter your website</h1>
          <p className="mt-4 text-2xl text-slate-500">
            We&apos;ll analyse your business details and generate knowledge base
          </p>
        </div>

        <div className="mt-12 rounded-[30px] border border-[#D7DFEC] bg-white px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-center gap-4">
            <Globe className="h-6 w-6 text-slate-400" />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
              placeholder="yourwebsite.com"
              className="flex-1 border-0 bg-transparent text-4xl text-slate-500 outline-none placeholder:text-slate-300"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!websiteUrl.trim() || isPending}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EDF7] text-slate-500 transition hover:bg-[#dbe5f6] disabled:opacity-50"
              aria-label="Analyze website"
            >
              {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <ChevronRight className="h-7 w-7" />}
            </button>
          </div>
        </div>

        <div className="mt-10 flex gap-6">
          <button
            type="button"
            onClick={() => setWebsiteUrl('')}
            className="flex-1 rounded-full bg-[#EAF2FF] px-6 py-5 text-2xl font-semibold text-[#2D78F4] transition hover:bg-[#dfeaff]"
          >
            No Website Yet?
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!websiteUrl.trim() || isPending}
            className="flex-1 rounded-full bg-[#2D78F4] px-6 py-5 text-2xl font-semibold text-white transition hover:bg-[#1f6ae5] disabled:opacity-50"
          >
            Continue
          </button>
        </div>

        {notice && <p className="mt-6 text-center text-base text-red-500">{notice}</p>}
      </div>
    </div>
  );
}

function ProgressState({
  websiteUrl,
  activeStep,
}: {
  websiteUrl: string;
  activeStep: number;
}) {
  return (
    <div className="flex min-h-[74vh] items-center justify-center">
      <div className="w-full max-w-[760px] rounded-[38px] border border-[#E4EBF5] bg-white px-12 py-12 shadow-[0_18px_55px_rgba(133,160,215,0.16)]">
        <h1 className="text-center text-6xl font-semibold tracking-tight text-slate-800">
          Building your knowledge
        </h1>

        <div className="mx-auto mt-10 max-w-[420px] rounded-[30px] border border-[#D8E2F0] bg-white p-4 shadow-sm">
          <div className="aspect-[16/10] overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#0e7f86_0%,#dbea15_100%)]">
            <div className="flex h-full items-end justify-between p-6">
              <div className="max-w-[180px] text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Scanning</p>
                <p className="mt-3 text-3xl font-bold leading-tight">Analyzing {trimDomain(websiteUrl)}</p>
              </div>
              <Sparkles className="h-14 w-14 text-white/80" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[420px] space-y-5">
          {BUILD_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-4 text-[18px] text-slate-500">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                index <= activeStep ? 'border-[#2D78F4] text-[#2D78F4]' : 'border-slate-300 text-slate-300'
              }`}>
                {index < activeStep ? <Check className="h-4 w-4" /> : index === activeStep ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </span>
              <span className={index === activeStep ? 'font-medium text-slate-700' : ''}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnowledgeState({
  brand,
  documents,
  section,
  onSectionChange,
}: {
  brand: any;
  documents: Array<{ key: string; label: string; url: string | null; content: string }>;
  section: SectionFilter;
  onSectionChange: (value: SectionFilter) => void;
}) {
  const showDocuments = section === 'All' || section === 'Documents';
  const showGuidelines = section === 'All' || section === 'Brand Guidelines';
  const images = Array.isArray(brand.referenceImages) ? brand.referenceImages : [];
  const colors = Array.isArray(brand.brandColors?.secondary) ? brand.brandColors.secondary : [];

  return (
    <div className="pb-10">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#E8EEF8] shadow-sm">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.brandName || 'Brand logo'} className="h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-8 w-8 text-[#2D78F4]" />
            )}
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-800">Lora knowledge</h1>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {SECTION_FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => onSectionChange(item)}
              className={`rounded-full border px-7 py-3 text-[20px] transition ${
                item === section
                  ? 'border-[#DCE8FF] bg-[#EAF2FF] font-semibold text-[#2D78F4]'
                  : 'border-[#D9E1EC] bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-8">
        {showDocuments && (
          <section className="rounded-[36px] border border-[#E3E9F2] bg-white p-8 shadow-[0_14px_42px_rgba(116,142,189,0.1)]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-semibold text-slate-800">Documents</h2>
              <Button
                variant="outline"
                className="rounded-full border-[#D8E2F0] px-8 py-3 text-2xl text-slate-700"
                disabled
              >
                Upload
              </Button>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {documents.map((doc) => (
                <a
                  key={doc.key}
                  href={doc.url ?? undefined}
                  target={doc.url ? '_blank' : undefined}
                  rel={doc.url ? 'noreferrer' : undefined}
                  className="flex items-center justify-between rounded-[20px] bg-[#F8FAFD] px-6 py-5 transition hover:bg-[#f1f6ff]"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-6 w-6 text-slate-500" />
                    <span className="text-[18px] font-medium text-slate-700">{doc.label}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </a>
              ))}
            </div>
          </section>
        )}

        {showGuidelines && (
          <section className="rounded-[36px] border border-[#E3E9F2] bg-white p-8 shadow-[0_14px_42px_rgba(116,142,189,0.1)]">
            <h2 className="text-3xl font-semibold text-slate-800">Brand Guidelines</h2>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_1.2fr]">
              <div className="space-y-5">
                <div className="rounded-[26px] bg-[#F8FAFD] p-8">
                  <h3 className="text-5xl font-semibold tracking-tight text-slate-800">
                    {brand.brandName || trimDomain(brand.websiteUrl)}
                  </h3>
                  <div className="mt-5 flex items-center gap-3 text-lg text-slate-500">
                    <Link2 className="h-5 w-5" />
                    <span>{brand.websiteUrl || 'No website connected yet'}</span>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="flex min-h-[260px] items-center justify-center rounded-[26px] bg-[#F8FAFD] p-8">
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logoUrl} alt="Brand logo" className="max-h-[180px] w-auto object-contain" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="mx-auto h-10 w-10" />
                        <p className="mt-3 text-sm">Logo not detected</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[26px] bg-[#F8FAFD] p-8">
                    <p className="text-2xl font-semibold text-slate-700">Fonts</p>
                    <div className="mt-12 text-center">
                      <div className="text-7xl font-serif text-[#7AAA1A]">Aa</div>
                      <p className="mt-6 text-2xl font-medium text-slate-700">Londrina Solid</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] bg-[#F8FAFD] p-6">
                  <p className="text-xl font-semibold text-slate-700">Brand colors</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      brand.brandColors?.primary,
                      brand.brandColors?.accent,
                      ...colors,
                    ]
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((color: string) => (
                        <div key={color} className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
                          <span className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium text-slate-600">{color}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-slate-700">Images</p>
                  <div className="rounded-[22px] bg-[#ECF9C5] px-5 py-4 text-center text-[#77A81B] shadow-sm">
                    <ImageIcon className="mx-auto h-6 w-6" />
                    <p className="mt-2 text-sm font-semibold leading-tight">UPLOAD IMAGES</p>
                  </div>
                </div>

                {images.length ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {images.slice(0, 12).map((image: string) => (
                      <div key={image} className="overflow-hidden rounded-[24px] bg-[#F8FAFD] shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="Brand reference" className="aspect-square h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[26px] bg-[#F8FAFD] p-10 text-center text-slate-400">
                    No reference images captured yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function trimDomain(value: string) {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}
