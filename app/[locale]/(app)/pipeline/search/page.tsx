"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { showSuccess, showError } from "@/lib/toasts";
import { addNotification } from "@/lib/notifications";
import { playPipelineSound, playErrorSound } from "@/lib/sounds";
import { getCompletedSteps, setCompletedSteps, isPremium } from "@/lib/auth";
import { PipelineHeader } from "@/components/ui/pipeline-header";
import { AppleButton } from "@/components/ui/apple-button";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { Search, MapPin, ArrowRight, ExternalLink, RotateCcw, Check, X } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

type PageState = "loading" | "incomplete" | "briefing" | "searching" | "results" | "error" | "adjusting";

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  salary: string | null;
  portal: string | null;
  description: string | null;
  ingested_at: string;
}

interface JobSearchResponse {
  jobs: Job[];
  count: number;
  fresh: boolean;
  ingest_job_id: string | null;
  message: string | null;
}

interface ProfileData {
  full_name?: string;
  job_target?: {
    target_titles?: string[];
    seniority?: string;
    work_mode?: string[];
    search_locations?: string[];
    keywords?: string[];
  };
  skills?: {
    programming_ml?: Array<Record<string, unknown>>;
    domain_expertise?: string[];
    software_tools?: string[];
  };
}

const WARM_MESSAGES: string[] = [
  "message01", "message02", "message03",
  "message04", "message05", "message06",
];

function timeAgo(iso: string, locale: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  const ago = locale === "es" ? "hace" : "";
  const suffix = locale === "es" ? "" : " ago";
  if (mins < 60) return `${ago} ${mins}m${suffix}`.trim();
  if (mins < 1440) return `${ago} ${Math.floor(mins / 60)}h${suffix}`.trim();
  return `${ago} ${Math.floor(mins / 1440)}d${suffix}`.trim();
}

function formatSeniority(s: string): string {
  const map: Record<string, string> = {
    junior: "Junior", mid: "Semi-Senior", senior: "Senior",
    lead: "Lead", manager: "Manager", director: "Director", executive: "Executive",
  };
  return map[s.toLowerCase()] || s;
}

function workModeLabel(modes: string[], locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    es: { remote: "Remoto", hybrid: "Híbrido", onsite: "Presencial" },
    en: { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" },
  };
  const dict = labels[locale] || labels.en;
  return modes.map(m => dict[m] || m).join(" · ");
}

export default function SearchPage() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const premium = isPremium();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [keywords, setKeywords] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ingestJobId, setIngestJobId] = useState<string | null>(null);
  const [currentMsgIdx, setCurrentMsgIdx] = useState(0);
  const [adjustKeywords, setAdjustKeywords] = useState("");
  const [adjustLocation, setAdjustLocation] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyResults = useCallback((list: Job[]) => {
    setJobs(list);
    setSelected(new Set(list.map(j => j.id)));
    setPageState(list.length > 0 ? "results" : "error");
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (msgIntervalRef.current) { clearInterval(msgIntervalRef.current); msgIntervalRef.current = null; }
  }, []);

  // Load profile on mount
  useEffect(() => {
    apiFetch<ProfileData>("/api/v1/setup/profile")
      .then(profileData => {
        setProfile(profileData);
        const jt = profileData?.job_target;
        if (jt?.target_titles?.length) {
          setKeywords(jt.target_titles.join(" "));
          if (jt.search_locations?.length) setLocation(jt.search_locations[0]);
          setPageState("briefing");
        } else {
          setPageState("incomplete");
        }
      })
      .catch(() => setPageState("incomplete"));
  }, []);

  // Start warm message rotation during search
  const startMessageRotation = useCallback(() => {
    setCurrentMsgIdx(0);
    msgIntervalRef.current = setInterval(() => {
      setCurrentMsgIdx(prev => (prev + 1) % WARM_MESSAGES.length);
    }, 4000);
  }, []);

  // Stop message rotation
  const stopMessageRotation = useCallback(() => {
    if (msgIntervalRef.current) {
      clearInterval(msgIntervalRef.current);
      msgIntervalRef.current = null;
    }
  }, []);

  // Main search function
  const handleSearch = useCallback(async (kw?: string, loc?: string) => {
    const q = (kw ?? keywords).trim() || (profile?.job_target?.target_titles?.join(" ") ?? "");
    if (!q) return;
    if (kw) setKeywords(kw);
    if (loc !== undefined) setLocation(loc);

    setPageState("searching");
    setJobs([]);
    setIngestJobId(null);
    startMessageRotation();

    try {
      const payload: Record<string, unknown> = { keywords: q };
      if (loc || location) payload.location = loc ?? location;

      const res = await apiFetch<JobSearchResponse>("/api/v1/jobs/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      stopMessageRotation();

      if (res.fresh) {
        applyResults(res.jobs ?? []);
      } else {
        // Ingest triggered, show partial results if any
        if (res.jobs?.length) setJobs(res.jobs);
        setIngestJobId(res.ingest_job_id);
        // Keep searching state while polling
      }
    } catch {
      stopMessageRotation();
      setPageState("error");
    }
  }, [keywords, location, profile, startMessageRotation, stopMessageRotation, applyResults]);

  // Polling for ingest status
  useEffect(() => {
    if (!ingestJobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const status = await apiFetch<{ status: string; result_count?: number; error?: string }>(
          `/api/v1/jobs/search/${ingestJobId}/status`
        );
        if (status.status === "done") {
          // Re-fetch results
          const q = keywords.trim() || (profile?.job_target?.target_titles?.join(" ") ?? "");
          const payload: Record<string, unknown> = { keywords: q };
          if (location) payload.location = location;
          try {
            const res = await apiFetch<JobSearchResponse>("/api/v1/jobs/search", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            applyResults(res.jobs ?? []);
          } catch {
            setPageState(jobs.length > 0 ? "results" : "error");
          }
        } else if (status.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setIngestJobId(null);
          setPageState(jobs.length > 0 ? "results" : "error");
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ingestJobId, keywords, location, profile, applyResults, jobs.length]);

  const toggleJob = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const proceedToRank = () => {
    const ids = [...selected];
    localStorage.setItem("rank_job_ids", JSON.stringify(ids));
    playPipelineSound("search");
    showSuccess(t("notificationFound", { count: selected.size, focus: keywords }));
    addNotification({
      pipeline: "search",
      description: t("notificationFound", { count: selected.size, focus: keywords }),
      status: "success",
    });
    const steps = getCompletedSteps();
    if (!steps.includes(2)) setCompletedSteps([...steps, 2]);
    router.push("/pipeline/rank");
  };

  const startAdjust = () => {
    setAdjustKeywords(keywords);
    setAdjustLocation(location);
    setPageState("adjusting");
  };

  const saveAdjust = () => {
    setKeywords(adjustKeywords);
    setLocation(adjustLocation);
    setPageState("briefing");
  };

  const completeProfile = () => {
    router.push("/pipeline/setup");
  };

  // Derived data
  const jt = profile?.job_target;
  const allSkills = [
    ...(profile?.skills?.programming_ml?.map(s => (typeof s === "object" && s !== null ? String((s as Record<string, unknown>).name || Object.keys(s)[0] || "") : "")) ?? []),
    ...(profile?.skills?.domain_expertise ?? []),
    ...(profile?.skills?.software_tools ?? []),
  ].filter(Boolean).slice(0, 6);
  const seniorityLabel = jt?.seniority ? formatSeniority(jt.seniority) : null;
  const modeLabel = jt?.work_mode?.length ? workModeLabel(jt.work_mode, locale) : null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <PipelineHeader
        eyebrow={t("eyebrow")}
        title={pageState === "results" ? t("resultsTitle", { count: jobs.length }) : t("briefingTitle")}
        subtitle={pageState === "searching" ? undefined : t("briefingSubtitle")}
      />

      {!premium && (
        <UpgradeBanner
          message={t("freeLimitation")}
          onUpgrade={() => setShowUpgrade(true)}
          upgradeLabel={t("upgrade")}
        />
      )}

      {/* ===== STATE: LOADING ===== */}
      {pageState === "loading" && (
        <div className="mt-16 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[#e8e8ed]" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      )}

      {/* ===== STATE: INCOMPLETE ===== */}
      {pageState === "incomplete" && (
        <div className="mt-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7]">
            <Search className="h-7 w-7 text-[#86868b]" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-[#1d1d1f]">{t("incompleteTitle")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73] max-w-md mx-auto">{t("incompleteDesc")}</p>
          <AppleButton className="mt-8" onClick={completeProfile}>
            {t("incompleteButton")}
          </AppleButton>
        </div>
      )}

      {/* ===== STATE: ADJUSTING ===== */}
      {pageState === "adjusting" && (
        <div className="mt-10">
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">{t("role")}</label>
              <input
                value={adjustKeywords}
                onChange={e => setAdjustKeywords(e.target.value)}
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition-colors focus:border-[#0071e3] focus:bg-white"
                placeholder={jt?.target_titles?.[0] ?? ""}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-2">{t("zone")}</label>
              <input
                value={adjustLocation}
                onChange={e => setAdjustLocation(e.target.value)}
                className="w-full rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition-colors focus:border-[#0071e3] focus:bg-white"
                placeholder={jt?.search_locations?.[0] ?? ""}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <AppleButton className="flex-1" onClick={saveAdjust}>
                {t("adjustSave")}
              </AppleButton>
              <AppleButton variant="ghost" className="flex-none" onClick={() => { setAdjustKeywords(keywords); setAdjustLocation(location); setPageState("briefing"); }}>
                <X className="h-4 w-4" />
              </AppleButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== STATE: BRIEFING ===== */}
      {pageState === "briefing" && (
        <div className="mt-10 animate-[fadeIn_0.4s_ease-out]">
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8 space-y-6">
            {/* Role — large, prominent */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t("role")}</p>
              <p className="mt-1.5 text-2xl font-semibold text-[#1d1d1f]">
                {jt?.target_titles?.join(" · ") || t("noValue")}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-6">
              {(jt?.search_locations?.length || location) && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t("zone")}</p>
                  <p className="mt-1 text-sm font-medium text-[#1d1d1f] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#858585]" />
                    {location || jt?.search_locations?.join(" · ") || t("noValue")}
                  </p>
                </div>
              )}
              {seniorityLabel && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t("level")}</p>
                  <p className="mt-1 text-sm font-medium text-[#1d1d1f]">{seniorityLabel}</p>
                </div>
              )}
              {modeLabel && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t("mode")}</p>
                  <p className="mt-1 text-sm font-medium text-[#1d1d1f]">{modeLabel}</p>
                </div>
              )}
            </div>

            {/* Skills as chips */}
            {allSkills.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#858585]">{t("keySkills")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allSkills.map(s => (
                    <span key={s} className="rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <AppleButton className="flex-1" onClick={() => handleSearch()}>
                <Search className="mr-2 h-4 w-4" /> {t("startSearching")}
              </AppleButton>
              <AppleButton variant="ghost" onClick={startAdjust}>
                {t("adjustSearch")}
              </AppleButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== STATE: SEARCHING ===== */}
      {pageState === "searching" && (
        <div className="mt-10 animate-[fadeIn_0.3s_ease-out]">
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8">
            {/* Animated indicator */}
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0071e3] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0071e3]" />
              </span>
              <div>
                <p className="text-[15px] font-medium text-[#1d1d1f]">{t("searchingTitle")}</p>
                <p className="mt-0.5 text-sm text-[#6e6e73]">{t(WARM_MESSAGES[currentMsgIdx])}</p>
              </div>
            </div>

            {/* Skeleton loaders */}
            <div className="mt-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-xl bg-[#e8e8ed]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex h-full items-center gap-4 px-5">
                    <div className="h-4 w-4 rounded border border-[#d2d2d7]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/5 rounded bg-[#d2d2d7]" />
                      <div className="h-3 w-2/5 rounded bg-[#d2d2d7]" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-[#d2d2d7]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Partial results note */}
            {jobs.length > 0 && (
              <p className="mt-4 text-center text-sm text-[#6e6e73]">
                {t("partialResults", { count: jobs.length })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== STATE: RESULTS ===== */}
      {pageState === "results" && (
        <div className="mt-10">
          {/* Result count header */}
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-medium text-[#1d1d1f]">
              {jobs.length === 1 ? t("oneResultTitle") : t("resultsTitle", { count: jobs.length })}
            </p>
            <button onClick={() => setPageState("briefing")} className="text-sm text-[#0066cc] hover:underline">
              {t("newSearch")}
            </button>
          </div>

          {/* Job list */}
          <div className="mt-4 divide-y divide-[#e8e8ed] rounded-2xl border border-[#d2d2d7] bg-white">
            {jobs.map((job) => (
              <label
                key={job.id}
                className="flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-[#f5f5f7]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(job.id)}
                  onChange={() => toggleJob(job.id)}
                  className="mt-1 h-4 w-4 accent-[#0071e3]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium text-[#1d1d1f]">{job.title}</p>
                    <span className="shrink-0 text-xs text-[#86868b]">{timeAgo(job.ingested_at, locale)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[#6e6e73]">
                    {job.company ?? t("noValue")}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {job.salary && (
                      <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs font-medium text-[#1d1d1f]">
                        {job.salary}
                      </span>
                    )}
                    {job.portal && (
                      <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium capitalize text-[#0066cc]">
                        {job.portal}
                      </span>
                    )}
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0066cc] hover:underline">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Sticky CTA */}
          <div className="sticky bottom-6 mt-8 flex items-center justify-between rounded-full border border-[#d2d2d7] bg-white/95 px-6 py-4 backdrop-blur shadow-sm">
            <p className="text-sm text-[#6e6e73]">
              {selected.size === jobs.length
                ? t("allSelected", { count: jobs.length })
                : t("selectedCount", { selected: selected.size, total: jobs.length })}
            </p>
            <AppleButton
              onClick={proceedToRank}
              disabled={selected.size === 0}
            >
              {t("continueToRank")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </AppleButton>
          </div>
        </div>
      )}

      {/* ===== STATE: ERROR ===== */}
      {pageState === "error" && (
        <div className="mt-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7]">
            <RotateCcw className="h-7 w-7 text-[#86868b]" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-[#1d1d1f]">{t("noResultsTitle")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73] max-w-md mx-auto">{t("noResultsHint")}</p>

          {/* Suggested quick searches */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["Software Developer", "Data Analyst", "DevOps", "Diseñador UX"].map(q => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="rounded-full border border-[#d2d2d7] bg-white px-4 py-1.5 text-sm text-[#1d1d1f] transition-colors hover:border-[#0071e3] hover:text-[#0071e3]"
              >
                {q}
              </button>
            ))}
          </div>

          <AppleButton className="mt-8" variant="ghost" onClick={() => handleSearch()}>
            <RotateCcw className="mr-2 h-4 w-4" /> {t("retry")}
          </AppleButton>

          <AppleButton className="mt-3" onClick={() => setPageState("briefing")}>
            {t("adjustSearch")}
          </AppleButton>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  );
}
