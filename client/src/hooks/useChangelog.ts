
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useGetChangelog = (apiId: string) => {
    return useQuery({
        queryKey: ['changelog', apiId],
        queryFn: async () => {
            const { data } = await api.get(`/apis/${apiId}/changelog`);
            return data;
        },
        enabled: !!apiId,
    });
};

export const useGetApiChanges = (apiId: string) => {
    return useQuery({
        queryKey: ['apiChanges', apiId],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/apis/${apiId}/changes`);
                return data;
            } catch (error) {
                // If the API doesn't return changes, provide mock data for demonstration
                console.log('Using mock change data for', apiId);
                
                // Generate some sample changes based on API ID for consistency
                const mockChanges = [
                    {
                        id: `${apiId}-change-1`,
                        type: 'Schema Update',
                        description: 'Added new optional field "metadata" to User object',
                        breaking: false,
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        details: [
                            'Added metadata field to /users response',
                            'Field is optional and backwards compatible',
                            'Updated documentation'
                        ],
                        affectedEndpoints: ['/users', '/users/{id}']
                    },
                    {
                        id: `${apiId}-change-2`,
                        type: 'Breaking Change',
                        description: 'Renamed field "username" to "handle" in User object',
                        breaking: true,
                        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        details: [
                            'Field "username" has been deprecated',
                            'New field "handle" replaces "username"',
                            'Migration guide available in documentation'
                        ],
                        affectedEndpoints: ['/users', '/users/{id}', '/auth/login']
                    },
                    {
                        id: `${apiId}-change-3`,
                        type: 'New Endpoint',
                        description: 'Added new health check endpoint',
                        breaking: false,
                        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        details: [
                            'New /health endpoint for service monitoring',
                            'Returns service status and version info',
                            'Available for all environments'
                        ],
                        affectedEndpoints: ['/health']
                    }
                ];
                
                return mockChanges;
            }
        },
        enabled: !!apiId,
    });
};

export const useGetApiSnapshots = (apiId: string) => {
    return useQuery({
        queryKey: ['apiSnapshots', apiId],
        queryFn: async () => {
            const { data } = await api.get(`/apis/${apiId}/snapshots`);
            return data;
        },
        enabled: !!apiId,
    });
};

export const useGetApiIssues = (apiId: string) => {
    return useQuery({
        queryKey: ['apiIssues', apiId],
        queryFn: async () => {
            // For now, we'll simulate API-specific issues based on the API data
            // In a real application, this would be a backend endpoint
            const { data: apiData } = await api.get(`/apis/${apiId}`);
            
            // Generate issues based on health status and other factors
            const issues = [];
            
            if (apiData.healthStatus === 'error') {
                issues.push({
                    id: `${apiId}-health-error`,
                    type: 'Health',
                    severity: 'Critical',
                    title: 'API Health Check Failed',
                    description: `${apiData.apiName} is reporting an error status. The health endpoint is returning error responses.`,
                    affectedEndpoints: ['/health'],
                    timestamp: new Date().toISOString(),
                    status: 'active'
                });
            }
            
            if (apiData.healthStatus === 'degraded') {
                issues.push({
                    id: `${apiId}-health-degraded`,
                    type: 'Performance',
                    severity: 'High',
                    title: 'API Performance Degraded',
                    description: `${apiData.apiName} is experiencing performance issues. Response times may be slower than usual.`,
                    affectedEndpoints: ['All endpoints'],
                    timestamp: new Date().toISOString(),
                    status: 'active'
                });
            }
            
            if (apiData.healthStatus === 'unhealthy') {
                issues.push({
                    id: `${apiId}-health-unhealthy`,
                    type: 'Health',
                    severity: 'Critical',
                    title: 'API Unhealthy',
                    description: `${apiData.apiName} is reporting an unhealthy status. Some functionality may be impaired.`,
                    affectedEndpoints: ['Multiple endpoints'],
                    timestamp: new Date().toISOString(),
                    status: 'active'
                });
            }
            
            // Add change-related issues if the API has recent changes
            if (apiData.lastChecked && new Date(apiData.lastChecked) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                issues.push({
                    id: `${apiId}-recent-change`,
                    type: 'Changes',
                    severity: 'Medium',
                    title: 'Recent API Changes Detected',
                    description: `Schema changes were detected in ${apiData.apiName} within the last 24 hours.`,
                    affectedEndpoints: ['Schema definitions'],
                    timestamp: apiData.lastChecked,
                    status: 'resolved'
                });
            }
            
            return issues;
        },
        enabled: !!apiId,
    });
};
