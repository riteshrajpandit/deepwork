"use client";

/**
 * LandingPage — scroll-driven video scrub
 *
 * Architecture decisions vs. the original:
 *
 * 1. DELTA NORMALIZATION
 *    Raw WheelEvent.deltaY varies wildly across input devices and OSes:
 *      • Mac trackpad (pixel mode)  → deltaMode 0, deltaY ≈ 3–8 px per event
 *      • Windows mouse wheel        → deltaMode 0, deltaY ≈ 100 px per event
 *      • Firefox on Linux           → deltaMode 1 (lines), deltaY ≈ 3
 *    We convert every event to a normalised "tick" in the range [0, 1] so the
 *    physics constants are device-independent.
 *
 * 2. NO fastSeek / currentTime SEEKING FOR MOMENTUM
 *    `video.currentTime = x` stalls the decoder pipeline and produces the
 *    "shutter" artefact.  Instead we set `video.playbackRate` and play/pause
 *    the element.  The browser's native video pipeline handles frame decode
 *    at whatever rate the hardware supports — no seek stalls, no keyframe
 *    pops.  We cap playbackRate at the browser limit (usually 16×).
 *
 * 3. INERTIA MODEL
 *    A simple exponential decay applied once per RAF frame.  The key insight
 *    is that the decay coefficient must be expressed per-frame, not
 *    per-second, and the threshold must match the minimum perceptible
 *    playback rate (≈ 0.05×).
 *
 * 4. VIDEO LOOPS SEAMLESSLY
 *    We listen for `timeupdate` and reset currentTime near the end so the
 *    video wraps without a freeze.  The threshold (LOOP_THRESHOLD) is tuned
 *    to the minimum decode look-ahead buffer so the reset happens while the
 *    browser still has decoded frames to display.
 *
 * 5. SINGLE RAF LOOP — never double-schedules, never leaks
 *    One raf ID tracked in a ref; cleaned up on unmount.
 */

import React, { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

// ─── Physics constants ───────────────────────────────────────────────────────

/**
 * How much of the velocity is retained each RAF frame.
 * At 60 fps a value of 0.92 gives ≈ 0.35 s of comfortable deceleration.
 * Lower → snappier stop.  Higher → longer coast.
 */
const MOMENTUM_DECAY = 0.92;

/**
 * Browsers enforce a minimum playbackRate (Chrome/Firefox: 0.0625, Safari: 0.1).
 * Setting below this throws NotSupportedError.  We use 0.1 as the safe floor
 * across all browsers — when velocity decays below this we pause() instead.
 */
const MIN_PLAYBACK_RATE = 0.1;

/**
 * RAF loop stops (and video pauses) below this velocity threshold.
 * Must be >= MIN_PLAYBACK_RATE to prevent any attempt to set an out-of-range rate.
 */
const STOP_THRESHOLD = MIN_PLAYBACK_RATE;

/**
 * Maximum playback rate.  Most browsers cap at 16; we stay well below to
 * keep decode quality high and avoid audio artifacts (audio is muted here
 * but good practice).
 */
const MAX_PLAYBACK_RATE = 8;

/**
 * Normalised wheel/touch input is multiplied by this to produce the initial
 * playback rate boost.  Tune this for "feel": higher = snappier response to
 * a flick; lower = more fluid.
 */
const SCROLL_SENSITIVITY = 4;

/**
 * Seconds before end at which we reset currentTime to 0 so the loop is
 * invisible.  Must be > one decode cycle; 0.3 s is safe for most devices.
 */
const LOOP_THRESHOLD = 0.3;

/**
 * Touch movement is in CSS pixels and tends to produce smaller deltas than
 * wheel events even after normalisation; this multiplier compensates.
 */
const TOUCH_SENSITIVITY = 1.8;

// ─────────────────────────────────────────────────────────────────────────────

/** Normalise a WheelEvent delta to a device-independent scalar ∈ [0, ∞). */
function normaliseDelta(e: WheelEvent): number {
  // deltaMode 1 = lines (~16 px each), deltaMode 2 = pages (~600 px each)
  const LINE_HEIGHT = 16;
  const PAGE_HEIGHT = 600;

  let px = Math.abs(e.deltaY);

  if (e.deltaMode === 1) px *= LINE_HEIGHT;
  if (e.deltaMode === 2) px *= PAGE_HEIGHT;

  // Clamp to avoid a single huge delta from sending the video flying.
  // 200 px is about two hard mouse-wheel clicks.
  return Math.min(px, 200) / 200; // → [0, 1]
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const rafRef      = useRef<number | null>(null);

  /**
   * Current playback-rate target.  The RAF loop drives `video.playbackRate`
   * toward zero; scroll/touch events add to it.
   */
  const rateRef = useRef(0);

  // ── Seamless video loop ────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      // Jump back to the start just before the end so the loop is imperceptible.
      if (video.currentTime >= video.duration - LOOP_THRESHOLD) {
        video.currentTime = 0;
      }
    };

    video.currentTime = 0;

    /**
     * Pre-warm the hardware decoder so the first scroll has zero cold-start
     * latency.  The one-time shutter on first scroll is caused by the browser
     * needing to initialise its decode pipeline only after play() is called
     * for the first time.  By playing briefly at the minimum rate right on
     * mount — before the user has touched anything — the pipeline is already
     * hot and buffered when the first scroll arrives.
     *
     * Strategy:
     *  1. Set playbackRate to MIN_PLAYBACK_RATE (0.1× — imperceptibly slow).
     *  2. play() → decoder initialises, first frame is handed to compositor.
     *  3. After 3 RAF frames (≈ 50 ms) pause() and reset to frame 0.
     *     The user never sees any movement.
     */
    const prewarm = async () => {
      try {
        video.playbackRate = MIN_PLAYBACK_RATE;
        await video.play();

        let frames = 0;
        const waitFrames = () => {
          frames++;
          if (frames < 3) {
            requestAnimationFrame(waitFrames);
          } else {
            video.pause();
            video.currentTime = 0;
            // Reset to neutral so the first real scroll starts clean.
            video.playbackRate = 1;
          }
        };
        requestAnimationFrame(waitFrames);
      } catch {
        // Autoplay policy blocked the prewarm — harmless. The first scroll
        // will have the original cold-start latency but nothing will break.
        video.pause();
        video.currentTime = 0;
      }
    };

    // Run prewarm once metadata is ready (duration / dimensions known).
    if (video.readyState >= 1) {
      prewarm();
    } else {
      video.addEventListener("loadedmetadata", prewarm, { once: true });
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", prewarm);
    };
  }, []);

  // ── Lock body scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  // ── RAF loop: applies playback rate and decays it ─────────────────────────
  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return; // already running

    const tick = () => {
      const video = videoRef.current;
      if (!video) {
        rafRef.current = null;
        return;
      }

      rateRef.current *= MOMENTUM_DECAY;

      if (rateRef.current < STOP_THRESHOLD) {
        // Velocity decayed below the browser's minimum playbackRate —
        // pause instead of setting an out-of-range value (NotSupportedError).
        rateRef.current = 0;
        video.pause();
        rafRef.current = null;
        return;
      }

      // Clamp strictly to [MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE].
      // Setting outside this range throws NotSupportedError in all browsers.
      const clampedRate = Math.min(
        Math.max(rateRef.current, MIN_PLAYBACK_RATE),
        MAX_PLAYBACK_RATE,
      );
      video.playbackRate = clampedRate;

      // Ensure the video is actually playing (it may have been paused by the
      // browser or by a previous stop).
      if (video.paused) {
        video.play().catch(() => {
          // Autoplay policy rejection — ignore; we'll retry next frame.
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Input handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const boost = normaliseDelta(e) * SCROLL_SENSITIVITY;
      rateRef.current = Math.min(rateRef.current + boost, MAX_PLAYBACK_RATE);
      startLoop();
    };

    let lastTouchY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY;
      if (y === undefined || lastTouchY === null) return;

      const delta = Math.abs(lastTouchY - y);
      const boost = Math.min(delta, 80) / 80 * SCROLL_SENSITIVITY * TOUCH_SENSITIVITY;
      rateRef.current = Math.min(rateRef.current + boost, MAX_PLAYBACK_RATE);
      startLoop();
      lastTouchY = y;
    };

    const onTouchEnd = () => { lastTouchY = null; };

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("touchend",   onTouchEnd);

    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [startLoop]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">

      {/* ── Background video ────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
          autoPlay={false}
          // Disabling the default controls prevents accidental playback-rate
          // changes by browser gestures.
          controls={false}
          // Hint to the browser that this video loops so it can pre-buffer
          // the beginning while playing the end.
          loop={false} // we handle looping manually for seamless wrapping
        >
          <source src="/sequence/background.mp4"  type="video/mp4"  />
          <source src="/sequence/background.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-background/55" />
      </div>

      {/* ── Decorative blur blob ─────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center relative z-20">

        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-outline-variant/30 mb-8 shadow-sm">
          <div className="w-6 h-6 bg-primary rotate-45 rounded-sm" />
        </div>

        {/* Headline */}
        <h1 className="text-display-xl md:text-[64px] font-display-xl text-on-surface tracking-tight leading-tight max-w-4xl mb-6">
          Find your deep work.<br />
          <span className="text-outline">Build in peace.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-body-lg md:text-xl font-body-lg text-on-surface-variant max-w-2xl mb-12">
          Trust &amp; Peace is the quiet project management platform designed
          to remove the noise so your team can focus on what actually matters.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            Get Started <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container-low transition-colors cursor-pointer ambient-shadow"
          >
            Sign In
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-20 flex gap-8 justify-center flex-wrap">
          {[
            "Unified Kanban Boards",
            "Integrated Documentation",
            "Real-time Org Sync",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-label-sm text-on-surface-variant"
            >
              <CheckCircle2 size={16} className="text-primary" />
              {feature}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}