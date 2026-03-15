import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

async function initializeFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  
  if (!ffmpegLoadingPromise) {
    console.log("[VIDEO] Initializing FFmpeg...");
    ffmpegLoadingPromise = (async () => {
      const instance = new FFmpeg();
      await instance.load();
      console.log("[VIDEO] FFmpeg loaded successfully");
      return instance;
    })();
  }
  
  ffmpeg = await ffmpegLoadingPromise;
  return ffmpeg;
}

export async function extractFramesFromVideo(videoBuffer: Buffer, numFrames = 3): Promise<string[]> {
  try {
    console.log("[VIDEO] Starting frame extraction...");
    const ffmpegInstance = await initializeFFmpeg();

    await ffmpegInstance.writeFile('input.mp4', new Uint8Array(videoBuffer));

    const frames: string[] = [];
    for (let i = 0; i < numFrames; i++) {
      console.log(`[VIDEO] Extracting frame ${i + 1}/${numFrames}...`);
      const timestamp = (i + 1) / (numFrames + 1);

      await ffmpegInstance.exec([
        '-ss', `${timestamp}`,
        '-i', 'input.mp4',
        '-vframes', '1',
        '-f', 'image2',
        `frame_${i}.jpg`
      ]);

      const frameData = await ffmpegInstance.readFile(`frame_${i}.jpg`);
      const base64Frame = Buffer.from(frameData as Uint8Array).toString('base64');
      frames.push(base64Frame);
      await ffmpegInstance.deleteFile(`frame_${i}.jpg`);
    }

    await ffmpegInstance.deleteFile('input.mp4');
    console.log("[VIDEO] Successfully extracted frames");
    
    return frames;
  } catch (error) {
    console.error('[VIDEO] Error extracting frames:', error);
    throw new Error('Failed to process video file.');
  }
}
