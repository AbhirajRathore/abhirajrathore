"use client";

import styles from "./Hero.module.css";
import Link from "next/link";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useMotionTemplate,
} from "framer-motion";
import { useEffect, useRef, useCallback } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

// green-screen chroma key thresholds
const GREEN_MIN       = 40;
const GREEN_DIFF_SOFT = 8;
const GREEN_DIFF_HARD = 28;

const CHIPS = [
    { label: "TypeScript", delay: 0    },
    { label: "Node.js",    delay: 0.08 },
    { label: "React.js",   delay: 0.16 },
    { label: "Kafka",      delay: 0.24 },
    { label: "PostgreSQL", delay: 0.32 },
    { label: "Redis",      delay: 0.40 },
    { label: "Docker",     delay: 0.48 },
    { label: "AWS",        delay: 0.56 },
];

export default function Hero() {
    const ref      = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);
    const sx = useSpring(mx, { stiffness: 40, damping: 30 });
    const sy = useSpring(my, { stiffness: 40, damping: 30 });
    const xPct = useTransform(sx, (v) => v * 100);
    const yPct = useTransform(sy, (v) => v * 100);
    const spotlightBg = useMotionTemplate`radial-gradient(900px circle at ${xPct}% ${yPct}%, var(--spot), transparent 55%)`;

    const onMove = useCallback(
        (e: MouseEvent) => {
            if (!ref.current) return;
            const r = ref.current.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width);
            my.set((e.clientY - r.top) / r.height);
        },
        [mx, my]
    );

    useEffect(() => {
        const el = ref.current;
        el?.addEventListener("mousemove", onMove);
        return () => el?.removeEventListener("mousemove", onMove);
    }, [onMove]);

    // green-screen chroma key
    useEffect(() => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        let animId: number;
        const diffRange = GREEN_DIFF_HARD - GREEN_DIFF_SOFT;

        const processFrame = () => {
            if (video.paused || video.ended) {
                animId = requestAnimationFrame(processFrame);
                return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = frame.data;
            for (let i = 0; i < d.length; i += 4) {
                const r = d[i], g = d[i + 1], b = d[i + 2];
                const diff = g - Math.max(r, b);
                if (g < GREEN_MIN || diff < GREEN_DIFF_SOFT) continue;
                d[i + 3] = diff >= GREEN_DIFF_HARD
                    ? 0
                    : Math.round((1 - (diff - GREEN_DIFF_SOFT) / diffRange) * 255);
            }
            ctx.putImageData(frame, 0, 0);
            animId = requestAnimationFrame(processFrame);
        };

        const onReady = () => {
            canvas.width  = video.videoWidth  || 480;
            canvas.height = video.videoHeight || 600;
            processFrame();
        };

        video.addEventListener("loadeddata", onReady);
        if (video.readyState >= 2) onReady();

        return () => {
            video.removeEventListener("loadeddata", onReady);
            cancelAnimationFrame(animId);
        };
    }, []);

    const nameLines = ["Abhiraj", "Rathore."];

    return (
        <section ref={ref} className={styles.hero}>
            <motion.div className={styles.spotlight} style={{ background: spotlightBg }} />
            <div className={styles.grain} />
            <div className={styles.amb1} />
            <div className={styles.amb2} />

            <div className={styles.layout}>
                {/* ── Left: text ──────────────────────────────── */}
                <div className={styles.text}>
                    <motion.div
                        className={styles.tag}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                    >
                        <span className={styles.dot} />
                        Software Engineer II
                    </motion.div>

                    <h1 className={styles.h1}>
                        {nameLines.map((word, i) => (
                            <span key={word} className={styles.clip}>
                                <motion.span
                                    className={styles.clipInner}
                                    initial={{ y: "120%" }}
                                    animate={{ y: "0%" }}
                                    transition={{ duration: 0.85, delay: 0.12 + i * 0.1, ease }}
                                >
                                    {word}
                                </motion.span>
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        className={styles.rule}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.7, delay: 0.45, ease }}
                    />

                    <motion.p
                        className={styles.blurb}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.55 }}
                    >
                        Building performant distributed systems &amp; elegant
                        full-stack experiences with obsessive attention to craft.
                    </motion.p>

                    <motion.div
                        className={styles.actions}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.65 }}
                    >
                        <Link href="#projects" className={styles.primary}>
                            <span>View Work</span>
                            <svg className={styles.arrow} width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M4 9h10M10.5 5L14 9l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <Link href="/contact" className={styles.ghost}>
                            Get in Touch
                        </Link>
                    </motion.div>

                    <motion.div
                        className={styles.metrics}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.85 }}
                    >
                        {[
                            { n: "3+",  l: "Years"    },
                            { n: "20+", l: "Projects" },
                            { n: "5+",  l: "Systems"  },
                        ].map((m, i) => (
                            <div key={m.l} className={styles.metric}>
                                {i > 0 && <span className={styles.metricDiv} />}
                                <div className={styles.metricInner}>
                                    <span className={styles.metricN}>{m.n}</span>
                                    <span className={styles.metricL}>{m.l}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ── Right: avatar + chips ────────────────────── */}
                <motion.div
                    className={styles.avatarCol}
                    initial={{ opacity: 0, scale: 0.94, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
                >
                    <div className={styles.glow} />
                    <div className={styles.frame}>
                        <video
                            ref={videoRef}
                            autoPlay loop muted playsInline
                            src="/Video_Editing_Black_to_Green2.mp4"
                            className={styles.hiddenVideo}
                        />
                        <canvas ref={canvasRef} className={styles.vid} />
                    </div>

                    {/* tech chips */}
                    <div className={styles.chips}>
                        {CHIPS.map((chip) => (
                            <motion.span
                                key={chip.label}
                                className={styles.chip}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.9 + chip.delay, ease: "easeOut" }}
                            >
                                {chip.label}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Apple-style scroll cue ───────────────────────── */}
            <motion.div
                className={styles.scrollCue}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
            >
                <span className={styles.scrollLabel}>Scroll</span>
                <div className={styles.mouse}>
                    <motion.div
                        className={styles.mouseDot}
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <motion.svg
                    className={styles.chevron}
                    width="16" height="10" viewBox="0 0 16 10" fill="none"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                >
                    <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
            </motion.div>
        </section>
    );
}
