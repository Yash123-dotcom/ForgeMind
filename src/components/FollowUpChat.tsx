
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
  role: 'user' | 'assistant';
  content: string;
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

export default function FollowUpChat({
  investigationId,
}: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || sending) return;

    const previousMessages = messages;
    const nextMessages: ChatMessage[] = [
      ...previousMessages,
      { role: 'user', content: message },
    ];

    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setVoiceError('');

    try {
      const response = await fetch(
        `/api/investigations/${encodeURIComponent(
          investigationId,
        )}/follow-up`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            history: previousMessages.slice(-10),
          }),
        },
      );

      const data: {
        success?: boolean;
        reply?: string;
        error?: string;
      } = await response.json();

      if (
        !response.ok ||
        !data.success ||
        typeof data.reply !== 'string'
      ) {
        throw new Error(
          data.error || 'Unable to get a debugging reply.',
        );
      }

      setMessages([
        ...nextMessages,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (error) {
      setMessages(nextMessages);
      setVoiceError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSending(false);
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
      setVoiceError('Could not initialize voice input. Please try again.');
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

  const toggleSpeech = (content: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceError(
        'Speech playback is not supported in this browser.',
      );
      return;
    }

    if (speakingRef.current) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    setVoiceError('');

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      speakingRef.current = true;
      setSpeaking(true);
    };

    utterance.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);
    };

    utterance.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
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

      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-sm text-foreground">
              What happened when you tried the recommended fix?
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              ForgeMind will use this investigation and its diagnosis as context.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
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
                onClick={() => toggleSpeech(message.content)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-brand"
                aria-label={speaking ? 'Stop speech' : 'Listen to response'}
              >
                {speaking ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {speaking ? 'Stop speech' : 'Listen'}
              </button>
            )}
          </article>
        ))}

        {sending && (
          <p
            className="text-xs text-foreground-muted"
            role="status"
            aria-live="polite"
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
            disabled={sending}
            className="min-w-0 flex-1 resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none disabled:opacity-60"
          />

          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={listening || sending}
              aria-label="Dictate message"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground hover:bg-surface-elevated disabled:opacity-50"
            >
              <Mic className="h-3.5 w-3.5" />
              {listening ? 'Listening' : 'Voice'}
            </button>

            <button
              type="submit"
              disabled={sending || !input.trim()}
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
  