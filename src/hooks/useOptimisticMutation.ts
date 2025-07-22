
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEnhancedRealtime } from '@/contexts/EnhancedRealtimeContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: (string | number)[];
  optimisticUpdate?: (variables: TVariables, previousData: any) => any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

export const useOptimisticMutation = <TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  successMessage,
  errorMessage,
  onSuccess,
  onError
}: OptimisticMutationOptions<TData, TVariables>) => {
  const queryClient = useQueryClient();
  const { addOptimisticUpdate, removeOptimisticUpdate } = useEnhancedRealtime();

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Apply optimistic update if provided
      if (optimisticUpdate && previousData) {
        const optimisticData = optimisticUpdate(variables, previousData);
        queryClient.setQueryData(queryKey, optimisticData);

        // Track optimistic update for potential rollback
        const updateId = `${queryKey.join('_')}_${Date.now()}`;
        addOptimisticUpdate({
          id: updateId,
          table: String(queryKey[0]),
          action: 'update',
          data: variables,
          rollback: () => {
            queryClient.setQueryData(queryKey, previousData);
          }
        });

        return { previousData, updateId };
      }

      return { previousData };
    },
    onError: (error: Error, variables: TVariables, context: any) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      if (context?.updateId) {
        removeOptimisticUpdate(context.updateId);
      }

      // Show error message
      if (errorMessage) {
        toast.error(errorMessage);
      }

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }

      console.error('Mutation failed:', error);
    },
    onSuccess: (data: TData, variables: TVariables, context: any) => {
      // Remove optimistic update tracking
      if (context?.updateId) {
        removeOptimisticUpdate(context.updateId);
      }

      // Show success message
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const mutateWithOptimistic = useCallback((variables: TVariables) => {
    return mutation.mutate(variables);
  }, [mutation]);

  const mutateAsyncWithOptimistic = useCallback((variables: TVariables) => {
    return mutation.mutateAsync(variables);
  }, [mutation]);

  return {
    ...mutation,
    mutateOptimistic: mutateWithOptimistic,
    mutateAsyncOptimistic: mutateAsyncWithOptimistic
  };
};
