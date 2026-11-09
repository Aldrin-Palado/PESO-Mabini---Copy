import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

type ESignatureInputProps = {
  value: string;
  disabled: boolean;
  onChange: (signature: string) => void;
};

function SignaturePad({
  value,
  disabled,
  onChange,
}: ESignatureInputProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      if (value.startsWith("data:image/")) {
        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0, bounds.width, bounds.height);
        };
        image.src = value;
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [value]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.strokeStyle = "#123B70";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  };

  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Draw your signature"
        className={`mt-2 h-40 w-full rounded-lg border border-slate-300 bg-white touch-none ${disabled ? "cursor-not-allowed opacity-70" : "cursor-crosshair"}`}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-normal normal-case tracking-normal text-slate-500">
          Sign in the box using your mouse, finger, or stylus.
        </p>
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || !value}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold normal-case tracking-normal text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function ESignatureInput({
  value,
  disabled,
  onChange,
}: ESignatureInputProps) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [error, setError] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a PNG, JPG, or WebP image for your signature.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("The signature image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const signatureImage = reader.result;
      if (typeof signatureImage !== "string") {
        setError("Unable to read the signature image. Please try again.");
        return;
      }
      onChange(signatureImage);
      setError("");
    };
    reader.onerror = () => {
      console.error("Signature image read error:", reader.error);
      setError("Unable to read the signature image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-2 normal-case tracking-normal">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("draw")}
          disabled={disabled}
          aria-pressed={mode === "draw"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "draw"
              ? "bg-[#0759AE] text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Draw signature
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          disabled={disabled}
          aria-pressed={mode === "upload"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            mode === "upload"
              ? "bg-[#0759AE] text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Upload signature
        </button>
      </div>

      {mode === "draw" ? (
        <SignaturePad value={value} disabled={disabled} onChange={onChange} />
      ) : (
        <div className="mt-3 rounded-lg border border-slate-300 bg-white p-3">
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
            disabled={disabled}
            aria-label="Upload an e-signature image"
            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
          />
          <p className="mt-2 text-xs text-slate-500">
            PNG, JPG, or WebP; maximum 2 MB.
          </p>
          {value.startsWith("data:image/") && (
            <div className="mt-3">
              <img
                src={value}
                alt="E-signature preview"
                className="max-h-32 max-w-full rounded-lg border border-slate-200 object-contain p-2"
              />
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={disabled}
                className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Remove signature
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
