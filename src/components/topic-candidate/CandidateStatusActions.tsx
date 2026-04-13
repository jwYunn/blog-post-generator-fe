import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2 } from 'lucide-react';
import { topicCandidateApi } from '../../api/topicCandidate';
import type { TopicCandidateStatus, UpdateCandidateStatus } from '../../types/topicCandidate';

interface Props {
  id: string;
  status: TopicCandidateStatus;
}

export default function CandidateStatusActions({ id, status }: Props) {
  const queryClient = useQueryClient();
  const [actionInProgress, setActionInProgress] = useState<UpdateCandidateStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate } = useMutation({
    mutationFn: (newStatus: UpdateCandidateStatus) =>
      topicCandidateApi.updateStatus(id, { status: newStatus }),
    onMutate: (newStatus) => {
      setActionInProgress(newStatus);
      setErrorMsg(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-candidates'] });
    },
    onError: () => {
      setErrorMsg('Failed to update status');
      setTimeout(() => setErrorMsg(null), 3000);
    },
    onSettled: () => {
      setActionInProgress(null);
    },
  });

  const isLoading = actionInProgress !== null;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        {/* pending / rejected → show Approve button */}
        {(status === 'pending' || status === 'rejected') && (
          <button
            onClick={() => mutate('approved')}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === 'approved' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Approve
          </button>
        )}

        {/* pending / approved → show Reject button */}
        {(status === 'pending' || status === 'approved') && (
          <button
            onClick={() => mutate('rejected')}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionInProgress === 'rejected' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
            Reject
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}
