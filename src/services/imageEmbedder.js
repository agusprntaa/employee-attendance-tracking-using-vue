import {
  ImageEmbedder,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let imageEmbedder = null;

export async function initImageEmbedder() {
  if (imageEmbedder) {
    return imageEmbedder;
  }

  const vision =
    await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

  imageEmbedder =
    await ImageEmbedder.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite",
        },

        runningMode: "IMAGE",
      }
    );

  return imageEmbedder;
}

export async function getEmbedding(
  imageElement
) {
  const result =
    imageEmbedder.embed(imageElement);

  return result.embeddings[0];
}

export function cosineSimilarity(
  emb1,
  emb2
) {
  return ImageEmbedder.cosineSimilarity(
    emb1,
    emb2
  );
}