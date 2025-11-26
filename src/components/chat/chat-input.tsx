"use client";

import { FormEvent, useState, useRef } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, MicOff, Send } from "lucide-react";

type Props = {
  onSubmit: (value: string) => void;
};

const LANGUAGES = [
  { label: "English", code: "en-US" },
  { label: "Bangla", code: "bn-BD" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Arabic", code: "ar-SA" },
];

export function ChatInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const prevTranscriptRef = useRef("");

  // Use transcript directly when available and different from current value
  const displayValue = listening && transcript ? transcript : value;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = (listening && transcript ? transcript : value).trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
    if (listening) {
      SpeechRecognition.stopListening();
      prevTranscriptRef.current = "";
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    if (listening) {
      // If user types while listening, stop listening
      SpeechRecognition.stopListening();
    }
  };

  const handleMicToggle = () => {
    if (!browserSupportsSpeechRecognition) return;
    if (listening) {
      SpeechRecognition.stopListening();
      // Sync final transcript to value when stopping
      if (transcript) {
        setValue(transcript.trim());
        prevTranscriptRef.current = transcript;
      }
      return;
    }
    prevTranscriptRef.current = "";
    SpeechRecognition.startListening({
      continuous: true,
      language,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputGroup className="rounded-2xl">
        <InputGroupTextarea
          value={displayValue}
          onChange={handleInputChange}
          placeholder='Ask for shoes, compare "iPhone 15 vs Samsung S23", track orders...'
          className="border-none bg-transparent px-3 text-base focus-visible:ring-0 max-h-40"
        />
        <InputGroupAddon
          align="block-end"
          className="flex-row items-center justify-between gap-2 border-t"
        >
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 w-full bg-transparent shadow-none focus:ring-0 md:w-40">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {browserSupportsSpeechRecognition && (
            <InputGroupButton
              type="button"
              size="icon-sm"
              variant={listening ? "destructive" : "ghost"}
              className="ml-auto rounded-full"
              onClick={handleMicToggle}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? <MicOff /> : <Mic />}
            </InputGroupButton>
          )}
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            className="rounded-full"
            disabled={!displayValue.trim()}
          >
            <Send />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
