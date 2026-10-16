import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

export function LoginForm({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
            <FieldGroup className="gap-4">
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#25272D] sm:text-3xl">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-balance text-[#747780]">
                        Sign in to access the JADE Clinic dashboard.
                    </p>
                </div>

                {status && (
                    <p
                        role="status"
                        className="rounded-lg bg-[#F5DEAC]/40 px-3 py-2 text-sm text-[#7B5A13]"
                    >
                        {status}
                    </p>
                )}

                <Field data-invalid={Boolean(errors.email)}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        required
                        aria-invalid={Boolean(errors.email)}
                        placeholder="name@jadeclinic.com"
                        className="h-11 bg-white focus-visible:border-[#D49A1F] focus-visible:ring-[#D49A1F]/20"
                        onChange={(event) => setData('email', event.target.value)}
                    />
                    <FieldError>{errors.email}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.password)}>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                            href="mailto:admin@jadeclinic.com"
                            className="ml-auto text-xs font-medium text-[#B77E12] underline-offset-4 hover:underline"
                        >
                            Contact administrator
                        </a>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            required
                            aria-invalid={Boolean(errors.password)}
                            placeholder="Enter your password"
                            className="h-11 bg-white pr-11 focus-visible:border-[#D49A1F] focus-visible:ring-[#D49A1F]/20"
                            onChange={(event) => setData('password', event.target.value)}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#747780] hover:bg-[#FFFBF3] hover:text-[#B77E12] focus-visible:outline-2 focus-visible:outline-[#D49A1F]"
                            onClick={() => setShowPassword((visible) => !visible)}
                        >
                            {showPassword ? (
                                <EyeOff aria-hidden="true" className="size-4" />
                            ) : (
                                <Eye aria-hidden="true" className="size-4" />
                            )}
                        </button>
                    </div>
                    <FieldError>{errors.password}</FieldError>
                </Field>

                <Field orientation="horizontal" className="items-center">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5F626A]">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            className="size-4 rounded border-[#D2D4D8] text-[#D49A1F] focus:ring-[#D49A1F]/25"
                            onChange={(event) => setData('remember', event.target.checked)}
                        />
                        Remember me
                    </label>
                </Field>

                <Field>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 bg-[#D49A1F] text-white hover:bg-[#B77E12] focus-visible:border-[#D49A1F] focus-visible:ring-[#D49A1F]/25"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle aria-hidden="true" className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight aria-hidden="true" />
                            </>
                        )}
                    </Button>
                    <FieldDescription className="text-center text-xs">
                        Authorized JADE Clinic personnel only.
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
