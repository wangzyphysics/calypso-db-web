"use client";
import { Globe2, Users } from "lucide-react";
import type { DatabaseStatistics } from "@/lib/materials/api";
import { worldRegions } from "@/lib/materials/world-map";

export function CommunityMap({
  community,
}: {
  community?: DatabaseStatistics["community"];
}) {
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
        <div className="community-stat">
          <Users size={20} />
          <strong>
            {total == null ? "—" : new Intl.NumberFormat("en-US").format(total)}
          </strong>
          <span>
            Registered users
            <small>
              {community?.registeredUsers.definition ??
                "Verified user statistics pending"}
            </small>
          </span>
        </div>
      </div>
      <div className="community-map" data-reveal data-reveal-step="1">
        <svg
          viewBox="0 20 900 350"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="map-title"
        >
          <title id="map-title">
            {hasRegions
              ? "Registered-user distribution by country and region"
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
                d={region.path}
                fill={fill}
                stroke="white"
                strokeWidth=".8"
              >
                <title>
                  {`${region.name}: ${count == null ? "user data unavailable" : `${count} registered users`}`}
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
        {community && <p className="map-definition">{community.definition}</p>}
      </div>
    </section>
  );
}
