import type { IStudentValuationDTO, StudentValuationUpdateData } from './types';
import { useStudentValuationStore } from './useStudentValuationStore';

/**
 * Backward-compatible wrapper: delegate to `useStudentValuationStore`'s `updateValuation` action.
 */
export const updateStudentValuation = async (
  valuationId: string,
  payload: StudentValuationUpdateData
): Promise<IStudentValuationDTO> => {
  // Use the store's action to perform the request and state updates
  return useStudentValuationStore.getState().updateValuation(valuationId, payload);
};

export default updateStudentValuation;
