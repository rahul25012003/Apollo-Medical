"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { BarChart3, CheckCircle2, Users, RefreshCw } from "lucide-react";

interface PollEngagement {
  id: string;
  title: string;
  description?: string | null;
  content: {
    options?: string[];
    allowMultiple?: boolean;
  };
  isActive: boolean;
}

interface PollResults {
  totalVotes: number;
  voteCounts: Record<string, number>;
  userVote: string | null;
}

interface EngagementPollsProps {
  engagement: PollEngagement;
  eventId: string;
  isAdmin: boolean;
}

export function EngagementPolls({ engagement, eventId, isAdmin }: EngagementPollsProps) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = engagement.content?.options || [];

  const fetchResults = useCallback(async () => {
    try {
      const res = await eventsService.getEngagementResponses(eventId, engagement.id);
      if (res.success && res.data) {
        const data = res.data as PollResults;
        setResults(data);
        if (data.userVote) {
          setHasVoted(true);
          setSelectedOption(data.userVote);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId, engagement.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleVote = async () => {
    if (!selectedOption || hasVoted) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await eventsService.submitEngagementResponse(eventId, engagement.id, {
        response: { answer: selectedOption },
      });

      if (res.success) {
        setHasVoted(true);
        await fetchResults();
      } else {
        setError(res.error?.message || "Failed to submit vote");
      }
    } catch {
      setError("Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AiimsLoader size="sm" />
      </div>
    );
  }

  const totalVotes = results?.totalVotes || 0;
  const voteCounts = results?.voteCounts || {};
  const showResults = hasVoted || isAdmin;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        </div>
        {showResults && (
          <Button variant="ghost" size="sm" onClick={fetchResults} className="h-7 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        )}
      </div>

      {engagement.description && (
        <p className="text-sm text-muted-foreground">{engagement.description}</p>
      )}

      {/* Poll Options */}
      <div className="space-y-2.5">
        {options.map((option) => {
          const count = voteCounts[option] || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedOption === option;

          return (
            <div key={option} className="relative">
              {showResults ? (
                /* Results View */
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl border transition-all duration-200",
                    isSelected
                      ? "border-teal-500/50 bg-teal-500/5"
                      : "border-border/50 bg-muted/30"
                  )}
                >
                  {/* Progress bar background */}
                  <div
                    className={cn(
                      "absolute inset-0 transition-all duration-700 ease-out",
                      isSelected
                        ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/10"
                        : "bg-gradient-to-r from-muted/50 to-transparent"
                    )}
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      )}
                      <span className={cn("text-sm font-medium", isSelected && "text-teal-600 dark:text-teal-400")}>
                        {option}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {count}
                      </span>
                      <span className={cn(
                        "text-xs font-bold min-w-[2.5rem] text-right",
                        isSelected ? "text-teal-600 dark:text-teal-400" : "text-foreground/70"
                      )}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Voting View */
                <button
                  onClick={() => setSelectedOption(option)}
                  disabled={!engagement.isActive}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                    isSelected
                      ? "border-teal-500 bg-teal-500/10 shadow-sm shadow-teal-500/10"
                      : "border-border/50 bg-muted/30 hover:border-teal-500/30 hover:bg-muted/50",
                    !engagement.isActive && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected
                        ? "border-teal-500 bg-teal-500"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-medium">{option}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Vote Button */}
      {!hasVoted && !isAdmin && engagement.isActive && (
        <div className="pt-1">
          {error && (
            <p className="text-sm text-destructive mb-2">{error}</p>
          )}
          <Button
            onClick={handleVote}
            disabled={!selectedOption || submitting}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
          >
            {submitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </div>
      )}

      {/* Admin Bar Chart */}
      {isAdmin && totalVotes > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vote Distribution
            </span>
          </div>
          <div className="space-y-2">
            {options.map((option) => {
              const count = voteCounts[option] || 0;
              const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={option} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 truncate">{option}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
