export interface RouteParams {
    [key: string]: string;
}

export interface Route {
    path: string;
    component: string;
    requireAuth?: boolean;
}

export class VSCodeRouter {
    private currentRoute: string = '/dashboard';
    private routes: Route[] = [
        { path: '/', component: 'auth', requireAuth: false },
        { path: '/login', component: 'auth', requireAuth: false },
        { path: '/dashboard', component: 'dashboard', requireAuth: true },
        { path: '/apis', component: 'apis', requireAuth: true },
        { path: '/apis/:id', component: 'api-detail', requireAuth: true },
        { path: '/add-api', component: 'add-api', requireAuth: true },
        { path: '/settings', component: 'settings', requireAuth: true },
        { path: '/analytics', component: 'analytics', requireAuth: true },
        { path: '/notifications', component: 'notifications', requireAuth: true },
        { path: '/changes', component: 'changes', requireAuth: true },
        { path: '/issues', component: 'issues', requireAuth: true }
    ];
    private listeners: ((route: string, params: RouteParams) => void)[] = [];

    getCurrentRoute(): string {
        return this.currentRoute;
    }

    navigate(path: string): void {
        this.currentRoute = path;
        const params = this.extractParams(path);
        this.notifyListeners(path, params);
    }

    onRouteChange(listener: (route: string, params: RouteParams) => void): void {
        this.listeners.push(listener);
    }

    removeListener(listener: (route: string, params: RouteParams) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    private extractParams(path: string): RouteParams {
        const params: RouteParams = {};
        const route = this.routes.find(r => this.matchRoute(r.path, path));
        
        if (route) {
            const routeParts = route.path.split('/');
            const pathParts = path.split('/');
            
            routeParts.forEach((part, index) => {
                if (part.startsWith(':')) {
                    const paramName = part.substring(1);
                    params[paramName] = pathParts[index] || '';
                }
            });
        }
        
        return params;
    }

    private matchRoute(routePath: string, currentPath: string): boolean {
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');
        
        if (routeParts.length !== pathParts.length) {
            return false;
        }
        
        return routeParts.every((part, index) => {
            if (part.startsWith(':')) {
                return true;
            }
            return part === pathParts[index];
        });
    }

    getRouteComponent(path: string): string | null {
        const route = this.routes.find(r => this.matchRoute(r.path, path));
        return route ? route.component : null;
    }

    requiresAuth(path: string): boolean {
        const route = this.routes.find(r => this.matchRoute(r.path, path));
        return route ? route.requireAuth === true : false;
    }

    private notifyListeners(route: string, params: RouteParams): void {
        this.listeners.forEach(listener => listener(route, params));
    }
}

export const router = new VSCodeRouter();
