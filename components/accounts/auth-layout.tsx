"use client";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Check,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import type { LoginMethod } from "@/lib/accounts/model";
const methods: {
  id: LoginMethod;
  label: string;
  caption: string;
  icon: typeof Mail;
}[] = [
  { id: "password", label: "Account", caption: "账号密码", icon: KeyRound },
  { id: "wechat", label: "WeChat", caption: "微信扫码", icon: MessageCircle },
  { id: "qq", label: "QQ", caption: "QQ 扫码", icon: MessageCircle },
  { id: "email", label: "Email", caption: "邮箱验证码", icon: Mail },
  { id: "sms", label: "Phone", caption: "短信验证码", icon: Smartphone },
  { id: "google", label: "Google", caption: "Google 账号", icon: LockKeyhole },
];
export function methodLabel(method: LoginMethod) {
  return methods.find((m) => m.id === method)?.label;
}
export function AccountIntroduction({ signup = false }: { signup?: boolean }) {
  return (
    <section className="login-introduction">
      <span className="eyebrow">A SHARED SCIENTIFIC WORKSPACE</span>
      <h1>
        A place for your
        <br />
        next discovery.
      </h1>
      <p>
        {signup ? "Join CALYPSO" : "Sign in"} to explore materials, build your
        research profile and keep your scientific contributions together.
      </p>
      <ul>
        <li>
          <Box size={19} />
          Explore by chemistry, symmetry and pressure
        </li>
        <li>
          <Check size={19} />
          Keep attribution consistent across batches
        </li>
        <li>
          <LockKeyhole size={19} />
          Choose who can see your contributions
        </li>
      </ul>
      <Link href="/docs#contribution-guide" className="text-link">
        How contributions work <ArrowRight size={16} />
      </Link>
    </section>
  );
}
export function LoginMethods({
  value,
  onChange,
  busy,
  signup = false,
}: {
  value: LoginMethod;
  onChange: (method: LoginMethod) => void;
  busy: boolean;
  signup?: boolean;
}) {
  return (
    <div
      className="login-methods"
      role="group"
      aria-label={
        signup ? "Registration verification method" : "Sign-in method"
      }
    >
      {methods
        .filter((m) => !signup || m.id !== "password")
        .map(({ id, label, caption, icon: Icon }) => (
          <button
            type="button"
            key={id}
            aria-pressed={value === id}
            disabled={busy}
            onClick={() => onChange(id)}
          >
            <Icon size={19} />
            <strong>{label}</strong>
            <small>{caption}</small>
          </button>
        ))}
    </div>
  );
}
export function ProviderPending({ method }: { method: LoginMethod }) {
  return (
    <div className="provider-pending">
      <LockKeyhole size={19} />
      <div>
        <strong>
          {methods.find((m) => m.id === method)?.caption} · Awaiting connection
        </strong>
        <p>
          This sign-in service is not configured yet. No codes or QR
          authorizations are generated.
        </p>
      </div>
    </div>
  );
}
