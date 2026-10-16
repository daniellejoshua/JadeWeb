import { LoginForm } from '@/components/login-form';
import { Head } from '@inertiajs/react';

export default function Login({ status }: { status?: string }) {
    return (
        <main className="grid h-dvh max-h-dvh overflow-hidden bg-white font-['Poppins'] lg:grid-cols-2">
            <Head title="Sign in to JADE Clinic" />

            <section className="relative flex min-h-0 flex-col gap-4 overflow-hidden p-5 sm:p-6 md:p-8">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 700 700"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <pattern id="login-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.25" fill="#D49A1F" opacity="0.13" />
                        </pattern>
                        <linearGradient id="login-line" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#D49A1F" stopOpacity="0" />
                            <stop offset="0.5" stopColor="#D49A1F" stopOpacity="0.2" />
                            <stop offset="1" stopColor="#D49A1F" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <rect x="-12" y="425" width="170" height="210" fill="url(#login-dots)" />
                    <path
                        d="M-65 590C75 500 170 565 285 505S510 390 765 470"
                        fill="none"
                        stroke="url(#login-line)"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M-80 620C65 530 180 605 305 535S540 430 780 505"
                        fill="none"
                        stroke="#D49A1F"
                        strokeOpacity="0.08"
                    />
                    <circle cx="654" cy="86" r="116" fill="none" stroke="#F5DEAC" strokeOpacity="0.25" />
                    <circle cx="654" cy="86" r="88" fill="none" stroke="#D49A1F" strokeDasharray="3 10" strokeOpacity="0.12" />
                </svg>

                <div className="relative z-10 flex justify-center lg:justify-start">
                    <div className="flex items-center gap-3 font-medium">
                        <img
                            src="/images/logo.png"
                            alt="JADE Clinic"
                            className="size-12 object-contain"
                        />
                        <div>
                            <div className="font-semibold tracking-[-0.02em] text-[#25272D]">
                                JADE CLINIC
                            </div>
                            <div className="text-xs font-normal text-[#747780]">
                                Dental Supply
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <LoginForm status={status} />
                    </div>
                </div>
            </section>

            <section
                aria-label="JADE Clinic analytics dashboard"
                className="relative hidden min-h-0 overflow-hidden bg-[linear-gradient(145deg,#FFFBF3_0%,#F9E8C2_100%)] lg:block"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 700 700"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <pattern id="hero-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                            <circle cx="3" cy="3" r="1.4" fill="#B77E12" opacity="0.18" />
                        </pattern>
                        <linearGradient id="hero-sweep" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#FFFFFF" stopOpacity="0.62" />
                            <stop offset="0.5" stopColor="#F5DEAC" stopOpacity="0.12" />
                            <stop offset="1" stopColor="#D49A1F" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="215" height="185" fill="url(#hero-dots)" />
                    <circle cx="654" cy="38" r="176" fill="none" stroke="#FFFFFF" strokeWidth="38" strokeOpacity="0.34" />
                    <circle cx="80" cy="650" r="185" fill="#FFFFFF" fillOpacity="0.22" />
                    <path
                        d="M-40 545C105 440 188 514 318 420S548 260 755 302"
                        fill="none"
                        stroke="url(#hero-sweep)"
                        strokeWidth="2"
                    />
                    <path
                        d="M-22 580C120 475 215 548 342 456S575 302 744 332"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeOpacity="0.34"
                    />
                    <g fill="none" stroke="#B77E12" strokeOpacity="0.22">
                        <circle cx="104" cy="120" r="34" strokeDasharray="4 8" />
                        <circle cx="104" cy="120" r="48" strokeOpacity="0.1" />
                        <path d="M104 72V46M104 194V168M56 120H30M178 120H152" />
                    </g>
                </svg>
                <img
                    src="/svg/jade-analytics-hero.svg"
                    alt="Gold glass analytics dashboard illustration"
                    className="absolute inset-0 z-10 h-full w-full object-contain p-8 xl:p-12"
                />
                <svg
                    aria-hidden="true"
                    viewBox="0 0 120 52"
                    className="pointer-events-none absolute top-7 right-8 z-20 h-10 w-24 opacity-60"
                >
                    <path d="M2 42h24l12-20 16 12L72 8l16 15 30-18" fill="none" stroke="#B77E12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <g fill="#FFF8E9" stroke="#B77E12" strokeWidth="1.5">
                        <circle cx="38" cy="22" r="3" />
                        <circle cx="72" cy="8" r="3" />
                        <circle cx="88" cy="23" r="3" />
                    </g>
                </svg>
                <div className="absolute right-8 bottom-7 left-8 z-20 text-center">
                    <p className="text-sm font-medium text-[#6F571F]">
                        Real-time metrics, inventory visibility, and AI-powered insights.
                    </p>
                </div>
            </section>
        </main>
    );
}
