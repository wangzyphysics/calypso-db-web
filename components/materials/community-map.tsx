"use client";
import { useState } from "react";
import { AnimatedNumber, useViewportAnimation } from "./animated-number";
import { Globe2, Users } from "lucide-react";
import type { DatabaseStatistics } from "@/lib/materials/api";
import { worldRegions } from "@/lib/materials/world-map";

export function CommunityMap({
  community: liveCommunity,
  demoCommunity,
}: {
  community?: DatabaseStatistics["community"];
  demoCommunity?: DatabaseStatistics["community"];
}) {
  const [cohort, setCohort] = useState<"live" | "demo" | null>(null);
  const showDemo = cohort === "demo" || (cohort === null && Boolean(demoCommunity));
  const community = showDemo ? demoCommunity : liveCommunity;
  const { ref, active } = useViewportAnimation<HTMLDivElement>();
  const [selected, setSelected] = useState<string | null>(null);
  const counts = new Map(
    community?.regions.map((region) => [region.countryCode, region.users]) ??
      [],
  );
  const maximum = Math.max(0, ...counts.values());
  const total = community?.registeredUsers.count;
  const hasRegions = counts.size > 0;
  return (
    <section className="community-section" aria-labelledby="community-heading">
      <div className="community-copy" data-reveal>
        <span className="eyebrow">A SHARED SCIENTIFIC HORIZON</span>
        <h2 id="community-heading">
          Built for curiosity.
          <br />
          Across borders.
        </h2>
        <p>
          A place for researchers to connect chemistry, crystal structures and
          high-pressure science.
        </p>
        {demoCommunity && <div className="statistics-cohort-switch" role="group" aria-label="Community statistics source"><button aria-pressed={!showDemo} onClick={() => setCohort("live")}>Live data</button><button aria-pressed={showDemo} onClick={() => setCohort("demo")}>Demo preview</button></div>}
        {showDemo && <p className="demo-data-label">SYNTHETIC DEMO · Illustrative accounts, not actual users.</p>}
        <div className="community-stat">
          <Users size={20} />
          <strong>
            {total == null ? "—" : <AnimatedNumber value={total} />}
          </strong>
          <span>
            {showDemo ? "Demo accounts" : "Registered users"}
            <small>
              {community?.registeredUsers.definition ??
                "Verified user statistics pending"}
            </small>
          </span>
        </div>
      </div>
      <div ref={ref} className="community-map" data-map-active={active} data-reveal data-reveal-step="1">
        <svg
          viewBox="0 20 900 350"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="map-title"
        >
          <title id="map-title">
            {hasRegions
              ? `${showDemo ? "Synthetic demo-account" : "Registered-user"} distribution by country and region`
              : "World reference map. User distribution is not yet available."}
          </title>
          {worldRegions.map((region) => {
            const count = counts.get(region.code);
            const fill =
              count == null
                ? "#e3e9ef"
                : `rgba(37,99,235,${maximum ? 0.14 + (0.86 * Math.log1p(count)) / Math.log1p(maximum) : 0.14})`;
            return (
              <path
                key={region.code}
                className={count ? `map-populated${selected === region.code ? " map-selected" : ""}` : undefined}
                d={region.path}
                fill={fill}
                stroke="white"
                strokeWidth=".8"
                style={count ? { animationDelay: `${(community?.regions.findIndex(entry => entry.countryCode === region.code) ?? 0) * 90}ms` } : undefined}
              >
                <title>
                  {`${region.name}: ${count == null ? "user data unavailable" : `${count} ${showDemo ? "demo accounts" : "registered users"}`}`}
                </title>
              </path>
            );
          })}
        </svg>
        <div className="map-caption">
          <span>
            <Globe2 size={13} />
            {hasRegions
              ? "Color intensity · log-scaled user count"
              : "User distribution · data pending"}
          </span>
          <a
            href="https://www.naturalearthdata.com/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth ↗
          </a>
        </div>
        {hasRegions ? <div className="map-region-counts" aria-label="Displayed country counts">{community?.regions.slice(0, 4).map(region => <button type="button" key={region.countryCode} aria-pressed={selected === region.countryCode} onClick={() => setSelected(selected === region.countryCode ? null : region.countryCode)}><span>{worldRegions.find(country => country.code === region.countryCode)?.name.replace("People's Republic of China", "China").replace("United States of America", "United States") ?? region.countryCode}</span><strong><AnimatedNumber value={region.users} sequence={1 + (community?.regions.indexOf(region) ?? 0)} /></strong></button>)}</div> : total != null && <p className="map-pending-note">Country groups appear when at least 3 registered accounts report the same country / region.</p>}
        {community && <p className="map-definition">{community.definition}</p>}
      </div>
    </section>
  );
}
