import { useRef, useState } from "react";

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;

export default function ImageCaptureUpload({ images, setImages }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [error, setError] = useState("");

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const total = images.length + incoming.length;

    if (total > MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} images — you'd have ${total}.`);
      return;
    }

    setError("");
    setImages([...images, ...incoming]);
  };

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i));
  };

  const belowMin = images.length < MIN_IMAGES;

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current.click()}
        >
          Take Photo
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
        >
          Upload Images
        </button>

        <span>
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="flex gap-2 mt-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative"
          >
            <img
              src={URL.createObjectURL(img)}
              className="w-16 h-16 object-cover rounded"
              alt={`upload-${i}`}
            />

            <button
              type="button"
              onClick={() => removeImage(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-sm">
          {error}
        </p>
      )}

      {belowMin && (
        <p className="text-amber-600 text-sm">
          Add at least {MIN_IMAGES - images.length} more image(s) to continue.
        </p>
      )}
    </div>
  );
}
