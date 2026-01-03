import type { Api } from '@jellyfin/sdk';
import type { AxiosRequestConfig } from 'axios';

/**
 * Creates an axios config with proper authentication headers.
 * The SDK's axios instance should handle this, but for custom endpoints
 * we need to ensure the Authorization header is properly set.
 */
export const getAuthenticatedConfig = (api: Api, config?: AxiosRequestConfig): AxiosRequestConfig => {
    const authHeader = api.authorizationHeader;

    return {
        ...config,
        headers: {
            ...config?.headers,
            'Authorization': authHeader
        }
    };
};

/**
 * Make an authenticated GET request to a custom endpoint.
 */
export async function authenticatedGet<T>(
    api: Api,
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await api.axiosInstance.get<T>(url, getAuthenticatedConfig(api, config));
    return response.data;
}

/**
 * Make an authenticated POST request to a custom endpoint.
 */
export async function authenticatedPost<T>(
    api: Api,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await api.axiosInstance.post<T>(url, data, getAuthenticatedConfig(api, config));
    return response.data;
}

/**
 * Make an authenticated DELETE request to a custom endpoint.
 */
export async function authenticatedDelete<T>(
    api: Api,
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response = await api.axiosInstance.delete<T>(url, getAuthenticatedConfig(api, config));
    return response.data;
}
