export {};

declare global {
    type RouteParams = Record<string, string | number> | string | number;

    interface Router {
        current(name?: string | string[]): boolean;
        has(name: string): boolean;
    }

    interface Route {
        (name: string, params?: RouteParams, absolute?: boolean): string;
        (): Router;
    }

    const route: Route;
}
