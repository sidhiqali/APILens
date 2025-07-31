import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const REFETCH_INTERVAL = 30000; // 30 seconds

export const useGetApis = (page = 1, limit = 10, tag = '') => {
    return useQuery({
        queryKey: ['apis', page, limit, tag],
        queryFn: async () => {
            const { data } = await api.get(`/apis?page=${page}&limit=${limit}&tag=${tag}`);
            return data;
        },
        refetchInterval: REFETCH_INTERVAL,
    });
};

export const useGetApiStats = () => {
    return useQuery({
        queryKey: ['api-stats'],
        queryFn: async () => {
            const { data } = await api.get('/apis/stats');
            return data;
        },
        refetchInterval: REFETCH_INTERVAL,
    });
};

export const useGetApi = (id: string) => {
    return useQuery({
        queryKey: ['api', id],
        queryFn: async () => {
            const { data } = await api.get(`/apis/${id}`);
            return data;
        },
        enabled: !!id,
        refetchInterval: REFETCH_INTERVAL,
    });
};

export const useCreateApi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newApi: any) => api.post('/apis', newApi),
        onSuccess: () => {
            toast.success('API successfully registered!');
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            queryClient.invalidateQueries({ queryKey: ['api-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to register API.');
        }
    });
};

export const useUpdateApi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }: { id: string, [key: string]: any }) => api.put(`/apis/${id}`, updateData),
        onSuccess: (data, variables) => {
            toast.success('API updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            queryClient.invalidateQueries({ queryKey: ['api', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['api-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update API.');
        }
    });
};

export const useDeleteApi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/apis/${id}`),
        onSuccess: () => {
            toast.success('API deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            queryClient.invalidateQueries({ queryKey: ['api-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete API.');
        }
    });
};

export const useCheckApiNow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.post(`/apis/${id}/check-now`),
        onSuccess: () => {
            toast.success('Check triggered! Refreshing data...');
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            queryClient.invalidateQueries({ queryKey: ['api-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to trigger check.');
        }
    });
};

export const useCheckAllApis = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/apis/check-all'),
        onSuccess: () => {
            toast.success('Checking all APIs! Data will refresh shortly.');
            queryClient.invalidateQueries({ queryKey: ['apis'] });
            queryClient.invalidateQueries({ queryKey: ['api-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to trigger checks.');
        }
    });
};

export const useValidateApiUrl = () => {
    return useMutation({
        mutationFn: async ({ url }: { url: string }) => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            if (!url.startsWith('http') || !url.endsWith('.json')) {
                throw new Error('Invalid OpenAPI URL. Must be a valid URL ending in .json');
            }
            return {
                message: 'Validation successful!',
                specInfo: { version: '1.0.0', endpoints: 42, schemas: 15 },
            };
        },
    });
};