"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

// Generic hook for GET requests
export function useApiQuery<T>(
  key: string[],
  path: string,
  options?: Omit<UseQueryOptions<T, ApiError, T>, "queryKey" | "queryFn">
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: () => api.get<T>(path),
    ...options,
  });
}

// Base options type for mutations (without context)
type ApiMutationOptions<T, V> = Omit<UseMutationOptions<T, ApiError, V>, "mutationFn" | "onSuccess"> & {
  onSuccess?: (data: T, variables: V) => void | Promise<unknown>;
};

// Hook for POST/PUT/PATCH mutations (with body)
export function useApiMutation<T, V = unknown>(
  method: "post" | "put" | "patch",
  getPath: (variables: V) => string,
  getBody: (variables: V) => unknown,
  options?: ApiMutationOptions<T, V>
): ReturnType<typeof useMutation<T, ApiError, V>>;

// Hook for DELETE mutations (no body)
export function useApiMutation<T, V = unknown>(
  method: "delete",
  getPath: (variables: V) => string,
  getBody: undefined,
  options?: ApiMutationOptions<T, V>
): ReturnType<typeof useMutation<T, ApiError, V>>;

// Implementation
export function useApiMutation<T, V = unknown>(
  method: "post" | "put" | "patch" | "delete",
  getPath: (variables: V) => string,
  getBody: ((variables: V) => unknown) | undefined,
  options?: ApiMutationOptions<T, V>
): ReturnType<typeof useMutation<T, ApiError, V>> {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation<T, ApiError, V>({
    mutationFn: (variables) => {
      const path = getPath(variables);
      if (method === "delete") {
        return api.delete<T>(path);
      }
      const body = getBody ? getBody(variables) : variables;
      return api[method]<T>(path, body);
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries by default
      queryClient.invalidateQueries({ queryKey: [] });
      // Call user-provided onSuccess if any
      onSuccess?.(data, variables);
    },
    ...restOptions,
  });
}

// Context type for optimistic mutations
interface OptimisticContext<T> {
  previousData: T[] | undefined;
}

// Optimistic update helper
export function useOptimisticMutation<
  T,
  V extends { id: string }
>(
  queryKey: string[],
  method: "post" | "put" | "patch" | "delete",
  getPath: (variables: V) => string,
  updateFn: (old: T[] | undefined, variables: V) => T[],
  getBody?: (variables: V) => unknown
) {
  const queryClient = useQueryClient();

  return useMutation<T, ApiError, V, OptimisticContext<T>>({
    mutationFn: (variables) => {
      const path = getPath(variables);
      if (method === "delete") {
        return api.delete<T>(path);
      }
      const body = getBody ? getBody(variables) : variables;
      return api[method]<T>(path, body);
    },
    onMutate: async (variables): Promise<OptimisticContext<T>> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<T[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<T[]>(queryKey, (old) =>
        updateFn(old, variables)
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Hook for paginated queries
export function usePaginatedQuery<T>(
  key: string[],
  path: string,
  params: { page?: number; limit?: number } = {},
  options?: Omit<UseQueryOptions<{ data: T[]; total: number }, ApiError>, "queryKey" | "queryFn">
) {
  const { page = 1, limit = 20 } = params;

  return useQuery<{ data: T[]; total: number }, ApiError>({
    queryKey: [...key, page, limit],
    queryFn: () =>
      api.get<{ data: T[]; total: number }>(path, { page, limit }),
    ...options,
  });
}

// Hook for infinite scroll queries
export function useInfiniteQuery<T>(
  key: string[],
  path: string,
  limit = 20
) {
  return useQuery<{ data: T[]; hasMore: boolean; nextCursor?: string }, ApiError>({
    queryKey: key,
    queryFn: () => api.get(path, { limit }),
    staleTime: 30 * 1000,
  });
}

// Hook for search queries with debouncing
export function useSearchQuery<T>(
  key: string,
  path: string,
  searchTerm: string,
  debounceMs = 300
) {
  return useQuery<T[], ApiError>({
    queryKey: [key, searchTerm],
    queryFn: () => api.get<T[]>(path, { q: searchTerm }),
    enabled: searchTerm.length >= 2,
    staleTime: 60 * 1000,
  });
}
