
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
