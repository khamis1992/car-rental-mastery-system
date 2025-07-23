import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (optimisticUpdate && previousData) {
        const newData = optimisticUpdate(variables, previousData);
        queryClient.setQueryData(queryKey, newData);
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context to roll back
    onError: (error: Error, variables: TVariables, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      if (errorMessage) {
        toast.error(errorMessage);
      }
      
      if (onError) {
        onError(error, variables);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (data: TData, variables: TVariables) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
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