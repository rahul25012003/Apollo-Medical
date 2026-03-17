"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events";
import { AiimsLoader } from "@/components/ui/aiims-loader";
import { Cloud, Send, Trash2, RefreshCw } from "lucide-react";

interface WordCloudEngagement {
  id: string;
  title: string;
  description?: string | null;
  content: {
    prompt?: string;
  };
  isActive: boolean;
}

interface WordCloudResults {
  totalResponses: number;
  wordFrequency: Record<string, number>;
  userWord: string | null;
  words: { id: string; word: string; userName: string | null; createdAt: string }[];
}

interface EngagementWordCloudProps {
  engagement: WordCloudEngagement;
  eventId: string;
  isAdmin: boolean;
}

// Color palette for word cloud
const WORD_COLORS = [
  "text-teal-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-blue-500",
  "text-violet-500",
  "text-pink-500",
  "text-amber-500",
  "text-rose-500",
  "text-indigo-500",
  "text-lime-500",
];

export function EngagementWordCloud({ engagement, eventId, isAdmin }: EngagementWordCloudProps) {
  const [results, setResults] = useState<WordCloudResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [word, setWord] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await eventsService.getEngagementResponses(eventId, engagement.id);
      if (res.success && res.data) {
        const data = res.data as WordCloudResults;
        setResults(data);
        if (data.userWord) {
          setHasSubmitted(true);
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

  const handleSubmit = async () => {
    if (!word.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await eventsService.submitEngagementResponse(eventId, engagement.id, {
        response: { word: word.trim() },
      });

      if (res.success) {
        setWord("");
        setHasSubmitted(true);
        await fetchResults();
      } else {
        setError(res.error?.message || "Failed to submit word");
      }
    } catch {
      setError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (responseId: string) => {
    try {
      await eventsService.deleteEngagementResponse(eventId, engagement.id, responseId);
      await fetchResults();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AiimsLoader size="sm" />
      </div>
    );
  }

  const wordFrequency = results?.wordFrequency || {};
  const maxFreq = Math.max(...Object.values(wordFrequency), 1);

  // Calculate font sizes based on frequency
  const getWordSize = (freq: number) => {
    const ratio = freq / maxFreq;
    if (ratio > 0.8) return "text-3xl font-bold";
    if (ratio > 0.6) return "text-2xl font-semibold";
    if (ratio > 0.4) return "text-xl font-medium";
    if (ratio > 0.2) return "text-lg";
    return "text-base";
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      {(engagement.content?.prompt || engagement.description) && (
        <p className="text-sm text-muted-foreground">
          {engagement.content?.prompt || engagement.description}
        </p>
      )}

      {/* Submit Word */}
      {engagement.isActive && !hasSubmitted && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a word or short phrase..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1"
              maxLength={50}
            />
            <Button
              onClick={handleSubmit}
              disabled={!word.trim() || submitting}
              size="icon"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {hasSubmitted && !isAdmin && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <Cloud className="w-4 h-4" />
          Your word has been added!
        </div>
      )}

      {/* Refresh */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {results?.totalResponses || 0} contribution{(results?.totalResponses || 0) !== 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={fetchResults} className="h-7 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Word Cloud */}
      {Object.keys(wordFrequency).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Cloud className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No words yet. Be the first to contribute!</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3 p-6 rounded-xl bg-muted/20 border border-border/50 min-h-[160px]">
          {Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([w, freq], i) => (
              <span
                key={w}
                className={cn(
                  "transition-all duration-300 hover:scale-110 cursor-default px-1",
                  getWordSize(freq),
                  WORD_COLORS[i % WORD_COLORS.length]
                )}
                title={`${w}: ${freq} time${freq !== 1 ? "s" : ""}`}
              >
                {w}
              </span>
            ))}
        </div>
      )}

      {/* Admin: All Words List */}
      {isAdmin && results?.words && results.words.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            All Submissions
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {results.words.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{w.word}</span>
                  <span className="text-xs text-muted-foreground">by {w.userName || "Anonymous"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(w.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
