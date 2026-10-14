"use client";
import { useState } from "react";
import { careerStages, emailSchema, type Profile } from "@/lib/accounts/model";

export function ResearchProfileFields({ profile, onChange, includeEmail = true }: {
  profile: Profile; onChange: (patch: Partial<Profile>) => void; includeEmail?: boolean;
}) {
  const [emailTouched, setEmailTouched] = useState(false);
  const emailInvalid = emailTouched && !emailSchema.safeParse(profile.contactEmail).success;
  return <div className="account-field-grid research-profile-fields">
    <label>Full name <span className="field-required">Required</span>
      <input aria-label="Full name" required maxLength={100} autoComplete="name" value={profile.displayName} onChange={e => onChange({ displayName: e.target.value })} />
    </label>
    {includeEmail && <label>Email address <span className="field-required">Required</span>
      <input aria-label="Email address" type="email" required maxLength={254} autoComplete="email" value={profile.contactEmail} aria-invalid={emailInvalid || undefined} aria-describedby={emailInvalid ? "profile-email-error" : undefined} onBlur={() => setEmailTouched(true)} onChange={e => onChange({ contactEmail: e.target.value })} />
      {emailInvalid && <small id="profile-email-error" className="field-error" role="alert">Enter a valid email address.</small>}
    </label>}
    <label>Institution <span className="field-required">Required</span>
      <input aria-label="Institution" required maxLength={200} autoComplete="organization" placeholder="University, institute or organization" value={profile.institution} onChange={e => onChange({ institution: e.target.value })} />
    </label>
    <label>Research group <span className="field-required">Required</span>
      <input aria-label="Research group" required maxLength={200} placeholder="Group or laboratory name" value={profile.researchGroup} onChange={e => onChange({ researchGroup: e.target.value })} />
    </label>
    <label>Career stage <span className="field-required">Required</span>
      <select aria-label="Career stage" required value={profile.careerStage} onChange={e => onChange({ careerStage: e.target.value as Profile["careerStage"] })}>
        <option value="" disabled>Select your career stage</option>
        {Object.entries(careerStages).filter(([value]) => value).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label>Country / region <span className="field-required">Required</span>
      <input aria-label="Country / region" required maxLength={100} autoComplete="country-name" value={profile.countryRegion} onChange={e => onChange({ countryRegion: e.target.value })} />
      <small className="account-muted">Used for country-level community totals. Groups smaller than 3 accounts are not shown publicly.</small>
    </label>
    <label>Department <span>Optional</span>
      <input aria-label="Department" maxLength={200} value={profile.department} onChange={e => onChange({ department: e.target.value })} />
    </label>
    <label>ORCID iD <span>Optional</span>
      <input aria-label="ORCID iD" maxLength={19} placeholder="0000-0000-0000-000X" value={profile.orcid} onChange={e => onChange({ orcid: e.target.value })} />
    </label>
  </div>;
}
