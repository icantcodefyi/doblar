import { expose } from "comlink";
import { bytesToBase64 } from "byte-base64";
import getFileType from 'magic-bytes.js';
import { ImageMagick, initializeImageMagick } from "@imagemagick/magick-wasm";
import { MagickImage } from "@imagemagick/magick-wasm/magick-image";
import { MagickFormat } from "@imagemagick/magick-wasm/magick-format";
import { MagickReadSettings } from '@imagemagick/magick-wasm/settings/magick-read-settings';
import heicDecode from "heic-decode-builds";
import { ImageFileTypes } from "$/constants";

interface ConvertFile {
  content: Uint8Array;
  convertTo: ImageFileTypes;
}

interface CompressFile {
  content: Uint8Array;
  format: ImageFileTypes;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const init = async () => {
  await initializeImageMagick();
  return true
}

export const convertFile = async (data: ConvertFile) => {
  await initializeImageMagick();

  const originalFileType = getFileType(data.content);

  // If file is HEIC, first process the file through `heic-decode`
  // and then let ImageMagick take care of the rest
  if(originalFileType.map(e => e.mime).includes("image/heif")) {
    const heif = await heicDecode({ buffer: data.content.buffer });
    const heifData = new Uint8Array(heif.data);

    const settings = new MagickReadSettings({
      width: heif.width,
      height: heif.height,
      format: MagickFormat.Rgba
    })

    let image = MagickImage.create();
    image.depth = 8
    image.read(heifData, settings);
    
    const convertedImage = await new Promise<Uint8Array>((fulfilled) => {
      // @ts-ignore
      image.write((newData) => fulfilled(newData), data.convertTo);
    });

    const stringData = bytesToBase64(convertedImage);
    return stringData;
  }

  else {
    let image = MagickImage.create();
    image.read(data.content);

    const convertedImage = await new Promise<Uint8Array>((fulfilled) => {
      // @ts-ignore
      image.write((newData) => fulfilled(newData), data.convertTo);
    });

    // We cannot return a Uint8Array from a web worker
    // so we convert the data to a Base64 string and then on 
    // the main thread, we convert it back for downloading
    const stringData = bytesToBase64(convertedImage);
    return stringData;
  }
};

export const compressFile = async (data: CompressFile) => {
  await initializeImageMagick();

  const originalFileType = getFileType(data.content);

  let image = MagickImage.create();

  // If file is HEIC, first process the file through `heic-decode`
  if(originalFileType.map(e => e.mime).includes("image/heif")) {
    const heif = await heicDecode({ buffer: data.content.buffer });
    const heifData = new Uint8Array(heif.data);

    const settings = new MagickReadSettings({
      width: heif.width,
      height: heif.height,
      format: MagickFormat.Rgba
    });

    image.depth = 8;
    image.read(heifData, settings);
  } else {
    image.read(data.content);
  }

  // Resize if dimensions are specified
  if (data.maxWidth || data.maxHeight) {
    const originalWidth = image.width;
    const originalHeight = image.height;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    if (data.maxWidth && data.maxHeight) {
      // Resize to fit within both constraints while maintaining aspect ratio
      const widthRatio = data.maxWidth / originalWidth;
      const heightRatio = data.maxHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      newWidth = Math.round(originalWidth * ratio);
      newHeight = Math.round(originalHeight * ratio);
    } else if (data.maxWidth) {
      // Resize based on width only
      const ratio = data.maxWidth / originalWidth;
      newWidth = data.maxWidth;
      newHeight = Math.round(originalHeight * ratio);
    } else if (data.maxHeight) {
      // Resize based on height only
      const ratio = data.maxHeight / originalHeight;
      newWidth = Math.round(originalWidth * ratio);
      newHeight = data.maxHeight;
    }
    
    // Only resize if the new dimensions are smaller
    if (newWidth < originalWidth || newHeight < originalHeight) {
      image.resize(newWidth, newHeight);
    }
  }

  // Set quality for all formats that support it
  image.quality = data.quality;

  const compressedImage = await new Promise<Uint8Array>((fulfilled) => {
    // @ts-ignore
    image.write((newData) => fulfilled(newData), data.format);
  });

  const stringData = bytesToBase64(compressedImage);
  return stringData;
};

const worker = {
  init,
  convertFile,
  compressFile
}

export type BaseWorkerType = typeof worker;

expose(worker)