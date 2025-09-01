
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
            const { data } = await api.get(`/apis/${apiId}/changes`);
            return data;
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
            const { data: apiData } = await api.get(`/apis/${apiId}`);
            
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
