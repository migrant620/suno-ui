package dev.m620.sunoui.audio;

import android.media.AudioFormat;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.net.Uri;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Decodes owned audio files without playing them or requesting microphone access. */
public final class SunoAudioModule extends ReactContextBaseJavaModule {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ConcurrentHashMap<String, Boolean> canceled = new ConcurrentHashMap<>();
    public SunoAudioModule(ReactApplicationContext context) { super(context); }
    @Override public String getName() { return "SunoAudio"; }
    @ReactMethod public void cancelWaveform(String id) {
        canceled.computeIfPresent(id, (key, value) -> true);
    }
    @ReactMethod public void decodeWaveform(String uri, int bins, String id, Promise promise) {
        if (bins < 8 || bins > 1024) { promise.reject("WAVEFORM_BINS", "Invalid waveform size"); return; }
        canceled.put(id, false);
        worker.execute(() -> {
            MediaExtractor extractor = new MediaExtractor();
            MediaCodec codec = null;
            try {
                if (Boolean.TRUE.equals(canceled.get(id))) throw new IllegalStateException("Canceled");
                Uri parsed = Uri.parse(uri);
                if (!"file".equals(parsed.getScheme()) && !"content".equals(parsed.getScheme())) {
                    throw new IllegalArgumentException("Choose a local audio file");
                }
                extractor.setDataSource(getReactApplicationContext(), parsed, null);
                MediaFormat input = null;
                for (int i = 0; i < extractor.getTrackCount(); i++) {
                    MediaFormat format = extractor.getTrackFormat(i);
                    String mime = format.getString(MediaFormat.KEY_MIME);
                    if (mime != null && mime.startsWith("audio/")) { extractor.selectTrack(i); input = format; break; }
                }
                if (input == null) throw new IllegalArgumentException("No audio track was found");
                double duration = input.getLong(MediaFormat.KEY_DURATION) / 1000000.0;
                if (!Double.isFinite(duration) || duration <= 0) throw new IllegalArgumentException("Audio duration is unavailable");
                double[] peaks = new double[bins];
                int sampleRate = input.getInteger(MediaFormat.KEY_SAMPLE_RATE);
                int channels = input.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
                int encoding = input.containsKey(MediaFormat.KEY_PCM_ENCODING) ? input.getInteger(MediaFormat.KEY_PCM_ENCODING) : AudioFormat.ENCODING_PCM_16BIT;
                long deadline = System.nanoTime() + 60000000000L;
                if ("audio/raw".equals(input.getString(MediaFormat.KEY_MIME))) {
                    ByteBuffer buffer = ByteBuffer.allocateDirect(524288);
                    while (true) {
                        check(id, deadline);
                        buffer.clear(); int size = extractor.readSampleData(buffer, 0);
                        if (size < 0) break;
                        buffer.position(0); buffer.limit(size);
                        sample(buffer, extractor.getSampleTime(), sampleRate, channels, encoding, duration, peaks);
                        extractor.advance();
                    }
                } else {
                    codec = MediaCodec.createDecoderByType(input.getString(MediaFormat.KEY_MIME));
                    codec.configure(input, null, null, 0); codec.start();
                    boolean inputDone = false, outputDone = false;
                    MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
                    while (!outputDone) {
                        check(id, deadline);
                        if (!inputDone) {
                            int index = codec.dequeueInputBuffer(10000);
                            if (index >= 0) {
                                ByteBuffer buffer = codec.getInputBuffer(index); buffer.clear();
                                int size = extractor.readSampleData(buffer, 0);
                                if (size < 0) { codec.queueInputBuffer(index, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputDone = true; }
                                else { codec.queueInputBuffer(index, 0, size, extractor.getSampleTime(), 0); extractor.advance(); }
                            }
                        }
                        int index = codec.dequeueOutputBuffer(info, 10000);
                        if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                            MediaFormat format = codec.getOutputFormat();
                            sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE); channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
                            encoding = format.containsKey(MediaFormat.KEY_PCM_ENCODING) ? format.getInteger(MediaFormat.KEY_PCM_ENCODING) : AudioFormat.ENCODING_PCM_16BIT;
                        } else if (index >= 0) {
                            ByteBuffer buffer = codec.getOutputBuffer(index);
                            if (buffer != null && info.size > 0) {
                                buffer.position(info.offset); buffer.limit(info.offset + info.size);
                                sample(buffer.slice(), info.presentationTimeUs, sampleRate, channels, encoding, duration, peaks);
                            }
                            outputDone = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                            codec.releaseOutputBuffer(index, false);
                        }
                    }
                }
                check(id, deadline);
                double max = 0; for (double peak : peaks) max = Math.max(max, peak);
                WritableArray values = Arguments.createArray();
                for (double peak : peaks) values.pushDouble(max > 0 ? peak / max : 0);
                WritableMap result = Arguments.createMap(); result.putArray("peaks", values); result.putDouble("duration", duration);
                promise.resolve(result);
            } catch (Exception error) { promise.reject("WAVEFORM_DECODE", error.getMessage(), error); }
            finally {
                if (codec != null) { try { codec.stop(); } catch (Exception ignored) {} codec.release(); }
                extractor.release(); canceled.remove(id);
            }
        });
    }
    private void check(String id, long deadline) {
        if (Boolean.TRUE.equals(canceled.get(id)) || Thread.currentThread().isInterrupted()) throw new IllegalStateException("Canceled");
        if (System.nanoTime() > deadline) throw new IllegalStateException("Audio took too long to decode. Choose a shorter file.");
    }
    private static void sample(ByteBuffer data, long timestamp, int rate, int channels, int encoding, double duration, double[] peaks) {
        data.order(ByteOrder.LITTLE_ENDIAN);
        int bytes = encoding == AudioFormat.ENCODING_PCM_FLOAT ? 4 : encoding == AudioFormat.ENCODING_PCM_16BIT ? 2 : 0;
        if (bytes == 0 || rate <= 0 || channels <= 0) throw new IllegalArgumentException("Unsupported PCM audio format");
        int frame = 0;
        while (data.remaining() >= bytes * channels) {
            double peak = 0;
            for (int channel = 0; channel < channels; channel++) {
                double value = bytes == 4 ? data.getFloat() : data.getShort() / 32768.0;
                if (Double.isFinite(value)) peak = Math.max(peak, Math.min(1, Math.abs(value)));
            }
            double seconds = Math.max(0, timestamp) / 1000000.0 + frame++ / (double) rate;
            int bin = Math.min(peaks.length - 1, Math.max(0, (int) (seconds / duration * peaks.length)));
            peaks[bin] = Math.max(peaks[bin], peak);
        }
    }
    @Override public void invalidate() { worker.shutdownNow(); super.invalidate(); }
}
