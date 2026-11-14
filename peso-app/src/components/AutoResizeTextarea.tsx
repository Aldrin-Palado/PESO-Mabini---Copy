import {
  useCallback,
  useLayoutEffect,
  useRef,
  type FormEventHandler,
  type TextareaHTMLAttributes,
} from "react";

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxHeight?: number;
};

export default function AutoResizeTextarea({
  className = "",
  defaultValue,
  maxHeight = 240,
  onInput,
  rows = 2,
  value,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(contentHeight, maxHeight)}px`;
    textarea.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight]);

  useLayoutEffect(() => {
    resize();
  }, [defaultValue, resize, value]);

  useLayoutEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
    onInput?.(event);
    resize();
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      onInput={handleInput}
      className={`${className} resize-none overflow-hidden`}
    />
  );
}
