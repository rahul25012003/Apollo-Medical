/**
 * Browser-side image helpers.
 *
 * Used where an image has to be stored in the database rather than on disk:
 * the app's file uploads write to `public/uploads`, which lives on the web
 * server's local filesystem and is wiped on every redeploy. Small images
 * (speaker headshots, for example) are resized here and persisted as data
 * URIs so they survive deploys without needing S3/Cloudinary.
 */

/**
 * Read an image file, scale it down so its longest edge is at most `maxEdge`
 * pixels, and return it as a JPEG data URI.
 *
 * Images already smaller than `maxEdge` are not upscaled. Transparency is
 * flattened onto white, since JPEG has no alpha channel.
 */
export function resizeImageToDataUrl(
  file: File,
  maxEdge = 400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const { width, height } = img;
        if (!width || !height) {
          reject(new Error("Image has no dimensions"));
          return;
        }

        const scale = Math.min(1, maxEdge / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not supported in this browser"));
          return;
        }

        // JPEG has no alpha, so flatten onto white instead of black
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to process image"));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode that image file"));
    };

    img.src = objectUrl;
  });
}
