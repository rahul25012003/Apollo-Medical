"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Trash2,
  RefreshCw,
  User,
} from "lucide-react";

interface QAEngagement {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
}

interface QAResponse {
  id: string;
  userId: string | null;
  userName: string | null;
  response: {
    text?: string;
    upvotes?: number;
    upvotedBy?: string[];
    answered?: boolean;
  };
  createdAt: string;
}

interface EngagementQAProps {
  engagement: QAEngagement;
  eventId: string;
  isAdmin: boolean;
  userId?: string;
}

export function EngagementQA({ engagement, eventId, isAdmin, userId }: EngagementQAProps) {
  const [questions, setQuestions] = useState<QAResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "upvoted">("newest");
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await eventsService.getEngagementResponses(eventId, engagement.id, {
        limit: 100,
        sort: sortBy,
      });
      if (res.success && res.data) {
        const data = res.data as unknown;
        if (Array.isArray(data)) {
          setQuestions(data as QAResponse[]);
        } else if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
          // Paginated response
          setQuestions(((data as Record<string, unknown>).data as QAResponse[]) || []);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId, engagement.id, sortBy]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await eventsService.submitEngagementResponse(eventId, engagement.id, {
        response: { text: newQuestion.trim(), upvotes: 0, upvotedBy: [], answered: false },
      });

      if (res.success) {
        setNewQuestion("");
        await fetchQuestions();
      } else {
        setError(res.error?.message || "Failed to submit question");
      }
    } catch {
      setError("Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (responseId: string) => {
    try {
      await eventsService.deleteEngagementResponse(eventId, engagement.id, responseId);
      await fetchQuestions();
    } catch {
      // silently fail
    }
  };

  // Sort questions
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "upvoted") {
      return (b.response?.upvotes || 0) - (a.response?.upvotes || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AiimsLoader size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {engagement.description && (
        <p className="text-sm text-muted-foreground">{engagement.description}</p>
      )}

      {/* Submit Question */}
      {engagement.isActive && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              className="flex-1"
              maxLength={500}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newQuestion.trim() || submitting}
              size="icon"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {/* Sort Toggle & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            variant={sortBy === "newest" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("newest")}
            className={cn("h-7 text-xs", sortBy === "newest" && "bg-teal-600 hover:bg-teal-700 text-white")}
          >
            <Clock className="w-3 h-3 mr-1" />
            Newest
          </Button>
          <Button
            variant={sortBy === "upvoted" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("upvoted")}
            className={cn("h-7 text-xs", sortBy === "upvoted" && "bg-teal-600 hover:bg-teal-700 text-white")}
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            Top
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchQuestions} className="h-7 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Questions List */}
      {sortedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedQuestions.map((q) => (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border p-3.5 transition-all duration-200",
                q.response?.answered
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border/50 bg-muted/20 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">{q.response?.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {q.userName || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {q.response?.answered && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Answered
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Upvote count display */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{q.response?.upvotes || 0}</span>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <>
                      {!q.response?.answered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Mark as answered - update via submit new response with answered flag
                            // For now, we handle this through the engagement update
                          }}
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          title="Mark as answered"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question count */}
      <div className="text-xs text-muted-foreground text-center">
        {sortedQuestions.length} question{sortedQuestions.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
