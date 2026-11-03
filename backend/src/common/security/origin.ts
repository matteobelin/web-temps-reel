const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i;

export function configuredOrigins(): string[] {
    return (process.env.FRONTEND_URL ?? "http://localhost:4200")
        .split(",")
        .map((value) => value.trim().replace(/\/$/, ""))
        .filter(Boolean);
}

export function isAllowedFrontendOrigin(origin?: string): boolean {
    return !origin || configuredOrigins().includes(origin) || LOCAL_ORIGIN.test(origin);
}
