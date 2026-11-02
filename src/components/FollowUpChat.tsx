
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Mic,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type FollowUpChatProps = {
  investigationId: string;
};

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionResultLikeList = {
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionResultListLike = {
  [index: number]: SpeechRecognitionResultLikeList;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type HistoryResponse = {
  success?: boolean;
  messages?: ChatMessage[];
  error?: string;
};

type SendResponse = {
  success?: boolean;
  reply?: string;
  messages?: ChatMessage[];
  error?: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'string'
  );
}

export default function FollowUpChat({
  investigationId,
}: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeInvestigationIdRef = useRef(investigationId);
  const sendAbortControllerRef = useRef<AbortController | null>(null);
  const loadHistoryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Keep activeInvestigationIdRef updated synchronously.
  useEffect(() => {
    activeInvestigationIdRef.current = investigationId;
  }, [investigationId]);

  // Load persisted conversation whenever the investigation changes.
  useEffect(() => {
    const controller = new AbortController();

    // Cancel in-flight message sends and speech playback if investigation changes.
    if (sendAbortControllerRef.current) {
      sendAbortControllerRef.current.abort();
      sendAbortControllerRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);

    async function loadHistory() {
      setLoadingHistory(true);
      setMessages([]);
      setHistoryError(null);
      setVoiceError('');

      try {
        const response = await fetch(
          `/api/investigations/${encodeURIComponent(
            investigationId,
          )}/follow-up`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        const data: HistoryResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'Unable to load conversation history.',
          );
        }

        if (!Array.isArray(data.messages)) {
          throw new Error('Invalid conversation history response.');
        }

        if (!data.messages.every(isChatMessage)) {
          throw new Error('Conversation history contains invalid messages.');
        }

        // Only commit messages if this response matches the current active investigation.
        if (activeInvestigationIdRef.current === investigationId) {
          setMessages(data.messages);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        if (activeInvestigationIdRef.current === investigationId) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Unable to load conversation history.',
          );
        }
      } finally {
        if (!controller.signal.aborted && activeInvestigationIdRef.current === investigationId) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistoryRef.current = () => {
      void loadHistory();
    };

    void loadHistory();

    return () => {
      controller.abort();
    };
  }, [investigationId]);

  // Clean up voice features and pending requests on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;

      if (sendAbortControllerRef.current) {
        sendAbortControllerRef.current.abort();
        sendAbortControllerRef.current = null;
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const sendMessage = async () => {
    const targetInvestigationId = investigationId;
    const message = input.trim();

    if (!message || sending || loadingHistory) return;

    const controller = new AbortController();
    sendAbortControllerRef.current = controller;

    setSending(true);
    setInput('');
    setVoiceError('');

    try {
      const response = await fetch(
        `/api/investigations/${encodeURIComponent(
          targetInvestigationId,
        )}/follow-up`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
          }),
          signal: controller.signal,
        },
      );

      const data: SendResponse = await response.json();

      if (
        !response.ok ||
        !data.success ||
        typeof data.reply !== 'string'
      ) {
        throw new Error(
          data.error || 'Unable to get a debugging reply.',
        );
      }

      // Drop stale response if the user navigated to another investigation.
      if (activeInvestigationIdRef.current !== targetInvestigationId) {
        return;
      }

      // Prefer the canonical records returned by the server.
      if (
        Array.isArray(data.messages) &&
        data.messages.length === 2 &&
        data.messages.every(isChatMessage)
      ) {
        setMessages((previous) => [
          ...previous,
          ...data.messages!,
        ]);
      } else {
        // Compatibility fallback if the API response omits message records.
        const now = new Date();

        setMessages((previous) => [
          ...previous,
          {
            id: `local-user-${now.getTime()}`,
            role: 'user',
            content: message,
            createdAt: now.toISOString(),
          },
          {
            id: `local-assistant-${now.getTime()}`,
            role: 'assistant',
            content: data.reply!,
            createdAt: new Date(now.getTime() + 1).toISOString(),
          },
        ]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // If user switched investigations, do not alter current input or error state.
      if (activeInvestigationIdRef.current !== targetInvestigationId) {
        return;
      }

      // Restore the draft so the user can retry.
      setInput(message);

      setVoiceError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      if (sendAbortControllerRef.current === controller) {
        sendAbortControllerRef.current = null;
      }

      if (activeInvestigationIdRef.current === targetInvestigationId) {
        setSending(false);
      }
    }
  };

  const startVoiceInput = () => {
    setVoiceError('');

    if (typeof window === 'undefined') return;

    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const SpeechRecognitionAPI =
      browserWindow.SpeechRecognition ??
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        'Voice input is not supported in this browser. Try Chrome or type your message.',
      );
      return;
    }

    if (recognitionRef.current) {
      setVoiceError(
        'Voice input is already active. Please try again shortly.',
      );
      return;
    }

    let recognition: SpeechRecognitionLike;

    try {
      recognition = new SpeechRecognitionAPI();
    } catch {
      setVoiceError(
        'Could not initialize voice input. Please try again.',
      );
      return;
    }

    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.[0]?.transcript?.trim();

      if (transcript) {
        setInput((previous) =>
          previous ? `${previous} ${transcript}` : transcript,
        );
      }
    };

    recognition.onerror = () => {
      setVoiceError(
        'Could not capture speech. Check microphone permission and try again.',
      );
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setVoiceError(
        'Could not start the microphone. Please try again.',
      );
    }
  };

  const toggleSpeech = (messageId: string, content: string) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      setVoiceError(
        'Speech playback is not supported in this browser.',
      );
      return;
    }

    // If currently playing this specific message, stop it.
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Cancel any previous message utterance and start the selected one.
    window.speechSynthesis.cancel();
    setVoiceError('');

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId((current) => (current === messageId ? null : current));
    };

    utterance.onerror = () => {
      setSpeakingMessageId((current) => (current === messageId ? null : current));
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-brand/20 bg-surface">
      <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10">
          <MessageCircle className="h-4 w-4 text-brand" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Continue debugging
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
            Ask follow-up questions, explain what happened after trying
            a fix, or use your microphone to describe the issue.
          </p>
        </div>
      </div>

      <div
        className="max-h-96 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {loadingHistory && (
          <p
            className="text-xs text-foreground-muted"
            role="status"
          >
            Loading conversation…
          </p>
        )}

        {historyError && !loadingHistory && (
          <div className="rounded-md border border-[#ef7770]/30 bg-[#ef7770]/5 p-3">
            <p className="text-xs text-[#ef7770]">{historyError}</p>
            <button
              type="button"
              onClick={() => loadHistoryRef.current?.()}
              className="mt-2 inline-flex items-center rounded border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-elevated"
            >
              Retry
            </button>
          </div>
        )}

        {!loadingHistory && !historyError && messages.length === 0 && !voiceError && (
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-sm text-foreground">
              What happened when you tried the recommended fix?
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              ForgeMind will use this investigation and its diagnosis as context.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isThisMessageSpeaking = speakingMessageId === message.id;

          return (
            <article
              key={message.id}
              className={`rounded-lg border p-3 ${
                message.role === 'user'
                  ? 'ml-5 border-brand/20 bg-brand/5'
                  : 'mr-3 border-border bg-background'
              }`}
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
                {message.role === 'user' ? 'You' : 'ForgeMind'}
              </p>

              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {message.content}
              </p>

              {message.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => toggleSpeech(message.id, message.content)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand"
                  aria-label={isThisMessageSpeaking ? 'Stop speech' : 'Listen to response'}
                >
                  {isThisMessageSpeaking ? (
                    <VolumeX className="h-3.5 w-3.5 text-brand" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  {isThisMessageSpeaking ? 'Stop speech' : 'Listen'}
                </button>
              )}
            </article>
          );
        })}

        {sending && (
          <p
            className="text-xs text-foreground-muted"
            role="status"
          >
            ForgeMind is thinking…
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell ForgeMind what happened…"
            rows={2}
            maxLength={3000}
            disabled={sending || loadingHistory}
            className="min-w-0 flex-1 resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none disabled:opacity-60"
          />

          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={listening || sending || loadingHistory}
              aria-label="Dictate message"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground hover:bg-surface-elevated disabled:opacity-50"
            >
              <Mic className="h-3.5 w-3.5" />
              {listening ? 'Listening' : 'Voice'}
            </button>

            <button
              type="submit"
              disabled={sending || loadingHistory || !input.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-background hover:bg-brand-light disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
        </form>

        {voiceError && (
          <p
            className="mt-2 text-xs text-[#ef7770]"
            role="status"
            aria-live="polite"
          >
            {voiceError}
          </p>
        )}

        <p className="mt-2 text-[10px] text-foreground-muted">
          Verify suggested changes in Unity. ForgeMind does not modify your project.
        </p>
      </div>
    </section>
  );
}
